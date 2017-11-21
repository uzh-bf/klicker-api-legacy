const _map = require('lodash/map')

const SessionExecService = require('../services/sessionExec')
const { QuestionInstanceModel } = require('../models')

/* ----- queries ----- */
const questionInstanceByIDQuery = (parentValue, { id }) => QuestionInstanceModel.findById(id)
const questionInstancesByPVQuery = parentValue => QuestionInstanceModel.find({ _id: { $in: parentValue.instances } })

const responsesByPVQuery = parentValue =>
  parentValue.responses.map(response => ({ id: response.id, ...response.value, createdAt: response.createdAt }))

const resultsByPVQuery = ({ results }) => {
  if (results && results.free) {
    return {
      free: _map(results.free, (result, key) => ({
        ...result,
        key,
      })),
    }
  }

  if (results && results.choices) {
    return results
  }

  return null
}

/* ----- mutations ----- */
const addResponseMutation = (parentValue, { instanceId, response }) =>
  // TODO: use redis
  // TODO: fingerprinting, IP...
  SessionExecService.addResponse({ instanceId, response })

module.exports = {
  // queries
  questionInstance: questionInstanceByIDQuery,
  questionInstancesByPV: questionInstancesByPVQuery,
  responsesByPV: responsesByPVQuery,
  resultsByPV: resultsByPVQuery,

  // mutations
  addResponse: addResponseMutation,
}
