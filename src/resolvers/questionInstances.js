const SessionExecService = require('../services/sessionExec')
const { QuestionInstanceModel, UserModel } = require('../models')

/* ----- queries ----- */
const activeInstancesQuery = async (parentValue, args, { auth }) => {
  // starting from the logged in user, populate the currently running session
  // from the running session, populate its active instances and return them
  const user = await UserModel.findById(auth.sub).populate([
    { path: 'runningSession', populate: { path: 'activeInstances' } },
  ])
  return user.runningSession.activeInstances
}

const questionInstanceByIDQuery = (parentValue, { id }) => QuestionInstanceModel.findById(id)
const questionInstancesByPVQuery = parentValue => QuestionInstanceModel.find({ _id: { $in: parentValue.instances } })

const responsesByPVQuery = parentValue =>
  parentValue.responses.map(response => ({ id: response.id, ...response.value, createdAt: response.createdAt }))

/* ----- mutations ----- */
const addResponseMutation = (parentValue, { instanceId, response }) =>
  // TODO: use redis
  // TODO: fingerprinting, IP...
  SessionExecService.addResponse({ instanceId, response })

module.exports = {
  // queries
  activeInstances: activeInstancesQuery,
  questionInstance: questionInstanceByIDQuery,
  questionInstancesByPV: questionInstancesByPVQuery,
  responsesByPV: responsesByPVQuery,

  // mutations
  addResponse: addResponseMutation,
}
