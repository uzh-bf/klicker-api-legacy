const AuthService = require('../services/auth')
const { QuestionInstanceModel, SessionModel, UserModel } = require('../models')

/* ----- queries ----- */
const allSessionsQuery = async (parentValue, args, { auth }) => {
  AuthService.isAuthenticated(auth)

  const user = await UserModel.findById(auth.sub).populate(['sessions'])
  return user.sessions
}

const sessionQuery = async (parentValue, { id }, { auth }) => {
  AuthService.isAuthenticated(auth)

  return SessionModel.findOne({ id, user: auth.sub })
}

/* ----- mutations ----- */
const createSessionMutation = async (parentValue, { session: { name, blocks } }, { auth }) => {
  AuthService.isAuthenticated(auth)

  // initialize a store for newly created instance models
  let instances = []

  // pass through all the question block in params
  // create question instances for all questions within
  const questionBlocks = blocks.map(block => ({
    questions: block.questions.map((question) => {
      // create a new question instance model
      const instance = new QuestionInstanceModel({
        question: question.id,
        user: auth.sub,
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
    blocks: questionBlocks,
    user: auth.sub,
  }).save()

  // save everything at once
  await Promise.all([
    ...instances.map(instance => instance.save()),
    newSession,
    UserModel.update(
      { _id: auth.sub },
      {
        $push: { sessions: newSession.id },
        $currentDate: { updatedAt: true },
      },
    ),
  ])

  // return the data of the new session
  return newSession
}

module.exports = {
  allSessions: allSessionsQuery,
  createSession: createSessionMutation,
  session: sessionQuery,
}
