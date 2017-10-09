const { QuestionInstanceModel, SessionModel, UserModel } = require('../models')

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
  const blocks = questionBlocks.filter(block => block.questions.length > 0).map((block, index) => ({
    key: index,
    status: 0,
    instances: block.questions.map((question) => {
      // create a new question instance model
      const instance = new QuestionInstanceModel({
        question: question.id,
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

  // if the session is already running, return it
  if (session.status === 1) {
    return session
  }

  // if the session was already completed, throw an error
  if (session.status === 2) {
    throw new Error('SESSION_ALREADY_COMPLETED')
  }

  // update the session status to RUNNING
  session.status = 1

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

  // if the session is not yet running, throw an error
  if (session.status === 0) {
    throw new Error('SESSION_NOT_STARTED')
  }

  // if the session was already completed, return it
  if (session.status === 2) {
    return session
  }

  // update the session status to COMPLETED
  session.status = 2

  // reset the running session id on the user
  const updatedUser = UserModel.findByIdAndUpdate(userId, {
    runningSession: null,
    $currentDate: { updatedAt: true },
  })

  // TODO: $currentDate ...
  const savedSession = session.save()

  await Promise.all([updatedUser, savedSession])

  return session
}

// add a new feedback to a session
const addFeedback = async ({ sessionId, content }) => {
  // TODO: security
  // TODO: rate limiting
  // TODO: ...

  const session = await SessionModel.findById(sessionId)

  // if the session is not yet running, throw an error
  if (session.status === 0) {
    throw new Error('SESSION_NOT_STARTED')
  }

  // if the session has already finished, throw an error
  if (session.status === 2) {
    throw new Error('SESSION_FINISHED')
  }

  // push a new feedback into the array
  session.feedbacks.push({ key: session.feedbacks.length, content })

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
}
