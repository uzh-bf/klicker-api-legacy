const AuthService = require('../services/auth')
const SessionService = require('../services/sessions')
const { SessionModel, UserModel } = require('../models')

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

  const newSession = await SessionService.createSession({
    name,
    questionBlocks: blocks,
    user: auth.sub,
  })
  return newSession
}

module.exports = {
  allSessions: allSessionsQuery,
  createSession: createSessionMutation,
  session: sessionQuery,
}
