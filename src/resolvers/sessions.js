const SessionService = require('../services/sessions')
const { SessionModel, UserModel } = require('../models')

/* ----- queries ----- */
const allSessionsQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate(['sessions'])
  return user.sessions
}

const sessionQuery = (parentValue, { id }, { auth }) => SessionModel.findOne({ id, user: auth.sub })

/* ----- mutations ----- */
const createSessionMutation = (parentValue, { session: { name, blocks } }, { auth }) => SessionService.createSession({
  name,
  questionBlocks: blocks,
  user: auth.sub,
})

const startSessionMutation = (parentValue, { id }, { auth }) => SessionService.startSession({ id, userId: auth.sub })

const endSessionMutation = (parentValue, { id }, { auth }) => SessionService.endSession({ id, userId: auth.sub })

module.exports = {
  allSessions: allSessionsQuery,
  createSession: createSessionMutation,
  endSession: endSessionMutation,
  session: sessionQuery,
  startSession: startSessionMutation,
}
