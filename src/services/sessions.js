const { QuestionInstanceModel, SessionModel, UserModel } = require('../models')

const SessionStatus = {
  CREATED: 'CREATED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
}

const getRunningSession = async (sessionId) => {
  const session = await SessionModel.findById(sessionId)

  // if the session is not yet running, throw an error
  if (session.status === SessionStatus.CREATED) {
    throw new Error('SESSION_NOT_STARTED')
  }

  // if the session has already finished, throw an error
  if (session.status === SessionStatus.COMPLETED) {
    throw new Error('SESSION_FINISHED')
  }

  return session
}

// create a new session
const createSession = async ({ name, questionBlocks, userId }) => {
  // ensure that the session contains at least one question block
  if (questionBlocks.length === 0) {
    throw new Error('EMPTY_SESSION')
  }

  // initialize a store for newly created instance models
  let instances = []

  // pass through all the question blocks in params
  // skip any blocks that are empty (erroneous blocks)
  // create question instances for all questions within
  const blocks = questionBlocks.filter(block => block.questions.length > 0).map(block => ({
    instances: block.questions.map((question) => {
      // create a new question instance model
      const instance = new QuestionInstanceModel({
        question,
        user: userId,
        version: 0,
      })

      // append the new question instance to the store
      instances = [...instances, instance]

      // return only the id of the new instance
      return instance.id
    }),
  }))

  // create a new session model
  // pass in the list of blocks created above
  const newSession = new SessionModel({
    name,
    blocks,
    user: userId,
  })

  // save everything at once
  await Promise.all([
    ...instances.map(instance => instance.save()),
    newSession.save(),
    UserModel.update(
      { _id: userId },
      {
        $push: { sessions: newSession.id },
        $currentDate: { updatedAt: true },
      },
    ),
  ])

  return newSession
}

// start an existing session
const startSession = async ({ id, userId }) => {
  // TODO: hydrate caches?
  // TODO: ...
  const user = await UserModel.findById(userId)

  if (user.runningSession) {
    throw new Error('RUNNING_ANOTHER_SESSION')
  }

  const session = await SessionModel.findById(id)

  // ensure the user is authorized to modify this session
  if (!session.user.equals(userId)) {
    throw new Error('UNAUTHORIZED')
  }

  // if the session is already running, return it
  if (session.status === SessionStatus.RUNNING) {
    return session
  }

  // if the session was already completed, throw an error
  if (session.status === SessionStatus.COMPLETED) {
    throw new Error('SESSION_ALREADY_COMPLETED')
  }

  // update the session status to RUNNING
  session.status = SessionStatus.RUNNING

  const updatedUser = UserModel.findByIdAndUpdate(userId, {
    runningSession: session.id,
    $currentDate: { updatedAt: true },
  })

  // TODO: $currentDate
  const savedSession = session.save()

  await Promise.all([updatedUser, savedSession])

  return session
}

// end (complete) an existing session
const endSession = async ({ id, userId }) => {
  // TODO: date compression? data aggregation?
  // TODO: cleanup caches?
  // TODO: ...

  const session = await SessionModel.findById(id)

  // ensure the user is authorized to modify this session
  if (!session.user.equals(userId)) {
    throw new Error('UNAUTHORIZED')
  }

  // if the session is not yet running, throw an error
  if (session.status === SessionStatus.CREATED) {
    throw new Error('SESSION_NOT_STARTED')
  }

  // if the session was already completed, return it
  if (session.status === SessionStatus.COMPLETED) {
    return session
  }

  // update the session status to COMPLETED
  session.status = SessionStatus.COMPLETED

  // reset the running session id on the user
  const updatedUser = UserModel.findByIdAndUpdate(userId, {
    runningSession: null,
    $currentDate: { updatedAt: true },
  })

  await Promise.all([updatedUser, session.save()])

  return session
}

// activate the next question block
const activateNextBlock = async ({ userId }) => {
  const user = await UserModel.findById(userId).populate(['activeInstances', 'runningSession'])
  const { runningSession } = user

  // TODO: check whether the currently active block was the last one => end session

  const nextBlockIndex = runningSession.activeBlock + 1
  if (nextBlockIndex < runningSession.blocks.length) {
    // find the next block
    const nextBlock = runningSession.blocks[nextBlockIndex]

    // update the instances in the new active block to be open
    await QuestionInstanceModel.update(
      { _id: { $in: nextBlock.instances } },
      { status: 'OPEN' },
      { multi: true },
    )

    runningSession.blocks[nextBlockIndex].status = 'ACTIVE'

    user.activeInstances = nextBlock.instances
  }

  runningSession.activeBlock += 1

  if (runningSession.activeBlock > 0) {
    // find the currently active block
    const previousBlock = runningSession.blocks[runningSession.activeBlock]

    // update the instances in the currently active block to be closed
    await QuestionInstanceModel.update(
      { _id: { $in: previousBlock.instances } },
      { status: 'CLOSED' },
      { multi: true },
    )

    // set the status of the previous block to executed
    runningSession.blocks[previousBlock].status = 'EXECUTED'
  }

  await Promise.all([runningSession.save(), user.save()])

  return user.runningSession
}

// add a new feedback to a session
const addFeedback = async ({ sessionId, content }) => {
  // TODO: security
  // TODO: rate limiting
  // TODO: ...

  const session = await getRunningSession(sessionId)

  // if the feedback channel is not activated, do not allow new additions
  if (!session.settings.isFeedbackChannelActive) {
    throw new Error('SESSION_FEEDBACKS_DEACTIVATED')
  }

  // push a new feedback into the array
  session.feedbacks.push({ content })

  // save the updated session
  await session.save()

  // return the updated session
  return session
}

// add a new confusion timestep to the session
const addConfusionTS = async ({ sessionId, difficulty, speed }) => {
  // TODO: security
  // TODO: rate limiting
  // TODO: ...

  const session = await getRunningSession(sessionId)

  // if the confusion barometer is not activated, do not allow new additions
  if (!session.settings.isConfusionBarometerActive) {
    throw new Error('SESSION_CONFUSION_DEACTIVATED')
  }

  // push a new timestep into the array
  session.confusionTS.push({ difficulty, speed })

  // save the updated session
  await session.save()

  // return the updated session
  return session
}

// update session settings
const updateSettings = async ({ sessionId, userId, settings }) => {
  // TODO: security
  // TODO: ...

  const session = await getRunningSession(sessionId)

  // ensure the user is authorized to modify this session
  if (!session.user.equals(userId)) {
    throw new Error('UNAUTHORIZED')
  }

  // merge the existing settings with the new settings
  session.settings = {
    ...session.settings,
    ...settings,
  }

  // if the feedback channel functionality is set to be deactivated
  // automatically unpublish the channel (needs manual reactivation)
  if (settings.isFeedbackChannelActive === false) {
    session.settings.isFeedbackChannelPublic = false
  }

  // save the updated session
  await session.save()

  // return the updated session
  return session
}

module.exports = {
  createSession,
  startSession,
  endSession,
  addFeedback,
  addConfusionTS,
  updateSettings,
  SessionStatus,
  activateNextBlock,
}
