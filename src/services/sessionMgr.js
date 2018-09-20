const mongoose = require('mongoose')
const { ForbiddenError } = require('apollo-server-express')

const { ObjectId } = mongoose.Types

const { sendSlackNotification } = require('./notifications')
const { QuestionInstanceModel, SessionModel, UserModel, QuestionModel } = require('../models')
const { getRedis } = require('../redis')
const {
  QUESTION_TYPES,
  QUESTION_GROUPS,
  SESSION_STATUS,
  QUESTION_BLOCK_STATUS,
  SESSION_ACTIONS,
  Errors,
} = require('../constants')
const { logDebug } = require('../lib/utils')

const redisCache = getRedis()
const redisControl = getRedis(2)
const responseCache = getRedis(3)

/**
 * If redis is in use, unlink the cached /join/:shortname pages
 * @param {*} shortname
 */
const cleanCache = shortname => {
  const key = `/join/${shortname}`

  logDebug(() => console.log(`[redis] Cleaning up SSR cache for ${key}`))

  // return redis.unlink([`${key}:de`, `${key}:en`])
  // TODO: use unlink with redis 4.x
  return redisCache.del([`${key}:de`, `${key}:en`])
}

/**
 * Ensure that the specified session is actually running
 * Then return the session as running
 * @param {*} sessionId
 */
const getRunningSession = async sessionId => {
  const session = await SessionModel.findById(sessionId)

  // if the session is not yet running, throw an error
  if (session.status === SESSION_STATUS.CREATED) {
    throw new ForbiddenError('SESSION_NOT_STARTED')
  }

  // if the session has already finished, throw an error
  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new ForbiddenError('SESSION_FINISHED')
  }

  return session
}

/**
 * Pass through all the question blocks in params
 * Skip any blocks that are empty (erroneous blocks)
 * Create question instances for all questions within
 * @param {*} param0
 */
const mapBlocks = ({ sessionId, questionBlocks, userId }) => {
  // initialize a store for newly created instance models
  let instances = []
  const promises = []

  const blocks = questionBlocks.filter(block => block.questions.length > 0).map(block => ({
    instances: block.questions.map(({ question, version }) => {
      // create a new question instance model
      const instance = new QuestionInstanceModel({
        question,
        session: sessionId,
        user: userId,
        version,
      })

      // update the question with the corresponding instances
      promises.push(
        QuestionModel.findByIdAndUpdate(question, {
          $push: { instances: instance.id },
        })
      )

      // append the new question instance to the store
      instances = [...instances, instance]

      // return only the id of the new instance
      return [instance.id]
    }),
  }))

  return {
    blocks,
    instances,
    promises,
  }
}
/**
 * Create a new session
 * @param {*} param0
 */
const createSession = async ({ name, questionBlocks = [], userId }) => {
  const sessionId = ObjectId()
  const { blocks, instances, promises } = mapBlocks({
    sessionId,
    questionBlocks,
    userId,
  })

  // create a new session model
  // pass in the list of blocks created above
  const newSession = new SessionModel({
    _id: sessionId,
    name,
    blocks,
    user: userId,
  })

  // save everything at once
  await Promise.all([
    ...promises,
    ...instances.map(instance => instance.save()),
    newSession.save(),
    UserModel.update(
      { _id: userId },
      {
        $push: { sessions: newSession.id },
      }
    ),
  ])

  return newSession
}

/**
 * Modify a session
 * @param {*} param0
 */
const modifySession = async ({ id, name, questionBlocks, userId }) => {
  // get the specified session from the database
  const sessionWithInstances = await SessionModel.findOne({
    _id: id,
    user: userId,
  }).populate('blocks.instances')
  const session = await SessionModel.findOne({
    _id: id,
    user: userId,
  })

  // ensure the user is authorized to modify this session
  if (!session) {
    throw new ForbiddenError(Errors.UNAUTHORIZED)
  }

  // if the session is anything other than newly created
  // it is not allowed to modify it anymore
  // TODO: allow modifications on blocks that are planned
  if (!session.status === SESSION_STATUS.CREATED) {
    throw new ForbiddenError(Errors.SESSION_ALREADY_STARTED)
  }

  // if the name parameter is set, update the session name
  if (name) {
    session.name = name
  }

  // if the question blocks parameter is set, update the blocks
  if (questionBlocks) {
    // calculate the ids of the old question instances
    const oldInstances = sessionWithInstances.blocks.reduce((acc, block) => [...acc, ...block.instances], [])

    // remove the question instance ids from the corresponding question entities
    const questionCleanup = oldInstances.map(instance =>
      QuestionModel.findByIdAndUpdate(instance.question, {
        $pull: { instances: instance.id },
      })
    )

    // completely remove the instance entities
    const instanceCleanup = QuestionInstanceModel.deleteMany({
      _id: { $in: oldInstances },
    })

    // map the blocks
    const { blocks, instances, promises } = mapBlocks({
      sessionId: id,
      questionBlocks,
      userId,
    })

    // replace the session blocks
    session.blocks = blocks

    // await all promises
    await Promise.all([...promises, instances.map(instance => instance.save()), questionCleanup, instanceCleanup])
  }

  // save the updated session to the database
  await session.save()

  // return the updated session
  return session
}

/**
 * Generic session action handler (start, pause, stop...)
 * @param {*} param0
 * @param {*} actionType
 */
const sessionAction = async ({ sessionId, userId }, actionType) => {
  // get the current user instance
  const user = await UserModel.findById(userId)
  const session = await SessionModel.findById(sessionId)

  // ensure the user is authorized to modify this session
  if (!user || !session || !session.user.equals(userId)) {
    throw new ForbiddenError('UNAUTHORIZED')
  }

  // perform the action specified by the actionType
  switch (actionType) {
    case SESSION_ACTIONS.START:
      // the user can't be running another session to start one
      if (user.runningSession) {
        throw new ForbiddenError('RUNNING_ANOTHER_SESSION')
      }

      // if the session is already running, just return it
      if (session.status === SESSION_STATUS.RUNNING) {
        return session
      }

      // if the session to start was already completed, throw an error
      if (session.status === SESSION_STATUS.COMPLETED) {
        throw new ForbiddenError('SESSION_ALREADY_COMPLETED')
      }

      // update the session status to RUNNING
      // this will also continue the session when it has been paused
      session.status = SESSION_STATUS.RUNNING

      // if the session has not been paused, initialize the startedAt date
      if (session.status !== SESSION_STATUS.PAUSED) {
        session.startedAt = Date.now()
      }

      break

    case SESSION_ACTIONS.PAUSE:
      if (!user.runningSession || session.status !== SESSION_STATUS.RUNNING) {
        throw new ForbiddenError('SESSION_NOT_RUNNING')
      }

      // if the session is already paused, return it
      if (session.status === SESSION_STATUS.PAUSED) {
        return session
      }

      // set the session status to be paused
      session.status = SESSION_STATUS.PAUSED

      break

    case SESSION_ACTIONS.STOP:
      // if the session is not yet running, throw an error
      if (session.status === SESSION_STATUS.CREATED) {
        throw new ForbiddenError('SESSION_NOT_STARTED')
      }

      // if the session was already completed, return it
      if (session.status === SESSION_STATUS.COMPLETED) {
        return session
      }

      // update the session status to COMPLETED
      session.status = SESSION_STATUS.COMPLETED

      session.finishedAt = Date.now()

      break

    default:
      throw new ForbiddenError('INVALID_SESSION_ACTION')
  }

  // update the runningSession of the user depending on the action taken
  const updatedUser = UserModel.findByIdAndUpdate(userId, {
    runningSession: actionType === SESSION_ACTIONS.START ? session.id : null,
  })

  const promises = [session.save(), updatedUser]

  // if redis is in use, cleanup the page cache
  if (redisCache) {
    promises.push(cleanCache(user.shortname))
  }

  await Promise.all(promises)

  sendSlackNotification(`[sessions] ${actionType} session at /join/${user.shortname}`)

  return session
}

/**
 * Start an existing session
 * @param {*} param0
 */
const startSession = ({ id, userId, shortname }) =>
  sessionAction({ sessionId: id, userId, shortname }, SESSION_ACTIONS.START)

/**
 * Pause a running session
 * @param {*} param0
 */
const pauseSession = ({ id, userId, shortname }) =>
  sessionAction({ sessionId: id, userId, shortname }, SESSION_ACTIONS.PAUSE)

/**
 * End (complete) an existing session
 * @param {*} param0
 */
const endSession = ({ id, userId, shortname }) =>
  sessionAction({ sessionId: id, userId, shortname }, SESSION_ACTIONS.STOP)

/**
 * Update session settings
 * @param {*} param0
 */
const updateSettings = async ({ sessionId, userId, settings, shortname }) => {
  // TODO: security
  // TODO: ...

  const session = await getRunningSession(sessionId)

  // ensure the user is authorized to modify this session
  if (!session.user.equals(userId)) {
    throw new ForbiddenError('UNAUTHORIZED')
  }

  // merge the existing settings with the new settings
  session.settings = {
    ...session.settings,
    ...settings,
  }

  // if the feedback channel functionality is set to be deactivated
  // automatically unpublish the channel (needs manual reactivation)
  if (settings.isFeedbackChannelActive === false) {
    session.settings.isFeedbackChannelPublic = false
  }

  // if redis is in use, cleanup the page cache
  if (redisCache) {
    await cleanCache(shortname)
  }

  // save the updated session
  await session.save()

  // return the updated session
  return session
}

/**
 * Activate the next question block of a running session
 * @param {*} param0
 */
const activateNextBlock = async ({ userId }) => {
  const user = await UserModel.findById(userId).populate(['activeInstances', 'runningSession'])
  const { shortname, runningSession } = user

  if (!runningSession) {
    throw new ForbiddenError('NO_RUNNING_SESSION')
  }

  // if all the blocks have already been activated, simply return the session
  if (runningSession.activeBlock === runningSession.blocks.length) {
    return user.runningSession
  }

  // prepare an array for promises to be executed
  const promises = []

  const prevBlockIndex = runningSession.activeBlock
  const nextBlockIndex = runningSession.activeBlock + 1

  if (nextBlockIndex < runningSession.blocks.length) {
    if (runningSession.activeInstances.length === 0) {
      // if there are no active instances, activate the next block
      runningSession.activeStep += 1

      // increase the index of the currently active block
      runningSession.activeBlock += 1

      // find the next block for the running session
      const nextBlock = runningSession.blocks[nextBlockIndex]

      // update the instances in the new active block to be open
      const instancePromises = nextBlock.instances.map(async instanceId => {
        const instance = await QuestionInstanceModel.findById(instanceId).populate('question')

        // set the instances to be open
        instance.isOpen = true

        // if a response cache is available, hydrate it with the newly activated instances
        if (responseCache) {
          const initializeResponseCache = responseCache.pipeline()

          // extract relevant information from the question entity
          const { question } = instance
          const questionVersion = question.versions[instance.version]

          // set the instance status, opening the instance for responses
          initializeResponseCache.hmset(`instance:${instance.id}:info`, 'status', 'OPEN', 'type', question.type)
          initializeResponseCache.hset(`instance:${instance.id}:results`, 'participants', 0)

          // TODO: temporarily save responses to redis

          // include the min/max restrictions in the cache for FREE_RANGE questions
          if (question.type === QUESTION_TYPES.FREE_RANGE) {
            initializeResponseCache.hmset(
              `instance:${instance.id}:info`,
              'min',
              questionVersion.restrictions.min,
              'max',
              questionVersion.restrictions.max
            )
          }

          // initialize results hash for SC and MC questions
          // FREE and FREE_RANGE will be initialized at runtime
          if (QUESTION_GROUPS.CHOICES.includes(question.type)) {
            // extract the options of the question
            const options = questionVersion.options.SC || questionVersion.options.mapBlocks

            // initialize all response counts to 0
            options.choices.forEach((_, index) => {
              initializeResponseCache.hset(`instance:${instance.id}:results`, index, 0)
            })
          }

          promises.push(initializeResponseCache.exec())
        }

        return instance.save()
      })

      // push the update promises to the list of all promises
      promises.concat(instancePromises)

      // set the status of the instances in the next block to active
      runningSession.blocks[nextBlockIndex].status = QUESTION_BLOCK_STATUS.ACTIVE

      // set the instances of the next block to be the users active instances
      runningSession.activeInstances = nextBlock.instances
    } else if (runningSession.activeBlock >= 0) {
      // if there are active instances, close them
      runningSession.activeStep += 1

      // find the currently active block
      const previousBlock = runningSession.blocks[prevBlockIndex]

      // update the instances in the currently active block to be closed
      const instancePromises = previousBlock.instances.map(async instanceId => {
        const instance = await QuestionInstanceModel.findById(instanceId)

        // set the instances to be open
        instance.isOpen = false

        // if a response cache is available, perform cleanup procedures
        if (responseCache) {
          const initializeResponseCache = responseCache.pipeline()

          // remove the instance status from redis
          // this will prevent any further responses
          initializeResponseCache.del(`instance:${instance.id}:status`)

          // extract the results from redis and persist them to mongo
          initializeResponseCache.set(`instance:${instance.id}:results`, 'TEST')

          promises.push(initializeResponseCache.exec())
        }

        return instance.save()
      })

      // push the update promises to the list of all promises
      promises.concat(instancePromises)

      runningSession.activeInstances = []

      // set the status of the previous block to executed
      runningSession.blocks[prevBlockIndex].status = QUESTION_BLOCK_STATUS.EXECUTED

      // if redis is available, cleanup the instance data from the previous block
      if (redisControl) {
        // calculate the keys to be unlinked
        const keys = previousBlock.instances.reduce(
          (prevKeys, instanceId) => [...prevKeys, `${instanceId}:fp`, `${instanceId}:ip`, `${instanceId}:responses`],
          []
        )

        logDebug(() => console.log('[redis] Cleaning up participant data for instances:', keys))

        // unlink the keys from the redis store
        // const unlinkKeys = await redis.unlink(keys)
        // TODO: use unlink with redis 4.x
        await redisControl.del(keys)
        // console.log(unlinkKeys)
        // promises.push(unlinkKeys)
      }
    }
  } else {
    // if the final block was reached above, reset the users active instances

    // set the status of the previous block to executed
    runningSession.blocks[prevBlockIndex].status = QUESTION_BLOCK_STATUS.EXECUTED

    runningSession.activeInstances = []
    runningSession.activeStep += 1
  }

  promises.concat([runningSession.save(), user.save()])
  await Promise.all(promises)

  // if redis is in use, cleanup the page cache
  if (redisCache) {
    await cleanCache(shortname)
  }

  return user.runningSession
}

/**
 * Delete a session
 * @param {*} param0
 */
const deleteSessions = async ({ userId, ids }) => {
  // get the session from the database
  const sessions = await SessionModel.find({ _id: { $in: ids }, user: userId }).populate('blocks.instances')

  await Promise.all(
    sessions.map(session => {
      // compute the list of question instances used in this session
      const instances = session.blocks.reduce((acc, block) => [...acc, ...block.instances], [])
      const instanceIds = instances.map(instance => instance.id)

      // delete the session and all related question instances
      // remove the session from the user model
      return Promise.all([
        SessionModel.deleteOne({ _id: session.id, user: userId }),
        QuestionInstanceModel.deleteMany({
          _id: { $in: instanceIds },
          user: userId,
        }),
        Promise.all(
          instances.map(instance =>
            QuestionModel.findByIdAndUpdate(instance.question, {
              $pull: { instances: instance.id },
            })
          )
        ),
        UserModel.findByIdAndUpdate(userId, { $pullAll: { sessions: [session.id] } }),
      ])
    })
  )

  return 'DELETION_SUCCESSFUL'
}

module.exports = {
  createSession,
  modifySession,
  startSession,
  endSession,
  updateSettings,
  activateNextBlock,
  getRunningSession,
  pauseSession,
  deleteSessions,
}
