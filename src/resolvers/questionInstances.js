const _map = require('lodash/map')

const SessionExecService = require('../services/sessionExec')
const { QuestionInstanceModel } = require('../models')

/* ----- queries ----- */
const questionInstanceByIDQuery = (parentValue, { id }) => QuestionInstanceModel.findById(id)
const questionInstancesByPVQuery = parentValue => QuestionInstanceModel.find({ _id: { $in: parentValue.instances } })

const responsesByPVQuery = parentValue =>
  parentValue.responses.map(({ id, value, createdAt }) => ({ id, ...value, createdAt }))

const resultsByPVQuery = ({ results }) => {
  if (results && results.free) {
    return {
      free: _map(results.free, (result, key) => ({ ...result, key })),
    }
  }

  if (results && results.choices) {
    const { choices, randomized } = results
    return {
      choices,
      randomized,
    }
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
