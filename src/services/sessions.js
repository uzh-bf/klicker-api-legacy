const { QuestionInstanceModel, SessionModel, UserModel } = require('../models')

const createSession = async ({ name, questionBlocks, user }) => {
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
    questions: block.questions.map((question) => {
      // create a new question instance model
      const instance = new QuestionInstanceModel({
        question: question.id,
        user,
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
    user,
  })

  // save everything at once
  await Promise.all([
    ...instances.map(instance => instance.save()),
    newSession.save(),
    UserModel.update(
      { _id: user },
      {
        $push: { sessions: newSession.id },
        $currentDate: { updatedAt: true },
      },
    ),
  ])

  return newSession
}

const startSession = async ({ id }) => {
  // TODO: hydrate caches?
  // TODO: ...

  const session = await SessionModel.findById(id)

  // if the session is already running, return it
  if (session.status === 1) {
    return session
  }

  // if the session was already completed, throw an error
  if (session.status === 2) {
    throw new Error('SESSION_ALREADY_COMPLETED')
  }

  session.status = 1

  await session.save({
    // TODO: calculate the id of the active instance
    $currentDate: { updatedAt: true },
  })

  return session
}

const endSession = async ({ id }) => {
  // TODO: date compression?
  // TODO: cleanup caches?
  // TODO: ...

  const session = await SessionModel.findById(id)

  if (session.status === 2) {
    return session
  }

  session.status = 2

  await session.save({
    $currentDate: { updatedAt: true },
  })

  return session
}

module.exports = {
  createSession,
  startSession,
  endSession,
}
