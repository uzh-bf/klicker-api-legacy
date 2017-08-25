const AuthService = require('../services/auth')
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

module.exports = {
  allSessions: allSessionsQuery,
  session: sessionQuery,
}
