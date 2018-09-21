const _map = require('lodash/map')
const { ensureLoaders } = require('../lib/loaders')
const SessionExecService = require('../services/sessionExec')
const SessionMgrService = require('../services/sessionMgr')
const { getRedis } = require('../redis')
const { QUESTION_GROUPS } = require('../constants')

const responseCache = getRedis(3)

/* ----- queries ----- */
const questionInstanceByIDQuery = (_, { id }, { loaders }) => ensureLoaders(loaders).questionInstances.load(id)

const questionInstancesByPVQuery = async (parentValue, args, { loaders }) => {
  const instances = await ensureLoaders(loaders).questionInstances.loadMany(parentValue.instances)
  return instances.filter(instance => !!instance)
}

const responsesByPVQuery = parentValue =>
  parentValue.responses.map(({ id, value, createdAt }) => ({
    id,
    ...value,
    createdAt,
  }))

const resultsByPVQuery = async ({ id, isOpen, results }) => {
  if (results && results.FREE) {
    return {
      FREE: _map(results.FREE, (result, key) => ({ ...result, key })),
      totalParticipants: results.totalParticipants,
    }
  }

  if (results && results.CHOICES) {
    return results
  }

  // if the results are still empty and the instance is open, fetch results from redis
  if (isOpen) {
    // extract responses from the redis cache (just-in-time)
    const result = await responseCache
      .pipeline()
      .hgetall(`instance:${id}:info`)
      .hgetall(`instance:${id}:results`)
      .hgetall(`instance:${id}:responseHashes`)
      .exec()
    const { type } = result[0][1]
    const redisResults = result[1][1]
    const responseHashes = result[2][1]

    if (QUESTION_GROUPS.CHOICES.includes(type)) {
      return SessionMgrService.choicesToResults(redisResults)
    }

    if (QUESTION_GROUPS.FREE.includes(type)) {
      const { FREE, totalParticipants } = SessionMgrService.freeToResults(redisResults, responseHashes)
      return {
        FREE: _map(FREE, (val, key) => ({ ...val, key })),
        totalParticipants,
      }
    }
  }

  return null
}

/* ----- mutations ----- */
const addResponseMutation = async (_, { fp, instanceId, response }, { ip }) => {
  await SessionExecService.addResponse({
    fp,
    ip,
    instanceId,
    response,
  })

  return 'RESPONSE_ADDED'
}

const deleteResponseMutation = async (_, { instanceId, response }, { auth }) => {
  await SessionExecService.deleteResponse({
    userId: auth.sub,
    instanceId,
    response,
  })

  return 'RESPONSE_DELETED'
}

module.exports = {
  // queries
  questionInstance: questionInstanceByIDQuery,
  questionInstancesByPV: questionInstancesByPVQuery,
  responsesByPV: responsesByPVQuery,
  resultsByPV: resultsByPVQuery,

  // mutations
  addResponse: addResponseMutation,
  deleteResponse: deleteResponseMutation,
}
