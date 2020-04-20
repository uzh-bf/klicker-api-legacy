const mongoose = require('mongoose')
const { ForbiddenError } = require('apollo-server-express')
const _mapValues = require('lodash/mapValues')
const _forOwn = require('lodash/forOwn')
const dayjs = require('dayjs')
const schedule = require('node-schedule')
const passwordGenerator = require('generate-password')

const { ObjectId } = mongoose.Types

const { sendSlackNotification } = require('./notifications')
const { QuestionInstanceModel, SessionModel, UserModel, QuestionModel } = require('../models')
const { getRedis } = require('../redis')
const { pubsub, SESSION_UPDATED, RUNNING_SESSION_UPDATED } = require('../resolvers/subscriptions')
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
const responseCache = getRedis(3)

function mapPropertyIds(elem) {
  if (Array.isArray(elem)) {
    return elem.map((obj) => ({ ...obj, id: obj._id, _id: undefined }))
  }

  const result = { ...elem }
  result.id = result._id
  delete result._id
  return result
}

async function publishRunningSessionUpdate({ sessionId }) {
  const result = await SessionModel.findById(sessionId).populate({
    path: 'blocks.instances',
    populate: [
      {
        path: 'question',
      },
    ],
  })

  const resultObj = mapPropertyIds(result.toObject())
  resultObj.blocks = resultObj.blocks.map((block) => ({
    ...mapPropertyIds(block),
    instances: mapPropertyIds(block.instances),
  }))

  // Publish Subscription Data to Subscribers
  await pubsub.publish(RUNNING_SESSION_UPDATED, {
    [RUNNING_SESSION_UPDATED]: resultObj,
    sessionId,
  })
}

async function publishSessionUpdate({ sessionId, activeBlock }) {
  const result = await SessionModel.findById(sessionId).populate({
    path: 'blocks.instances',
    populate: [
      {
        path: 'question',
        populate: {
          path: 'versions.files',
        },
      },
    ],
  })
  const resultObj = result.toObject()

  if (resultObj.activeBlock === null || resultObj.activeBlock !== activeBlock) {
    throw new Error('INVALID_ACTIVE_BLOCK')
  }

  const activeBlockData = resultObj.blocks[activeBlock]
  if (activeBlockData && activeBlockData.instances !== null) {
    if (activeBlockData.status === QUESTION_BLOCK_STATUS.EXECUTED) {
      resultObj.activeInstances = []
    } else {
      resultObj.timeLimit = activeBlockData.timeLimit
      resultObj.expiresAt = activeBlockData.expiresAt
      resultObj.activeInstances = activeBlockData.instances.map((instance) => {
        const { question } = instance
        const versionInfo = question.versions[instance.version]
        return {
          id: instance._id,
          execution: activeBlockData.execution,
          questionId: question._id,
          title: question.title,
          type: question.type,
          content: versionInfo.content,
          description: versionInfo.description,
          options: versionInfo.options,
          files: versionInfo.files.map((el) => ({ ...el, id: el._id, _id: undefined })),
        }
      })
    }
  }

  resultObj.id = resultObj._id
  delete resultObj._id

  const properties = ['blocks', 'feedbacks', 'confusionTS']
  properties.forEach((property) => {
    resultObj[property] = resultObj[property].map((el) => ({ ...el, id: el._id, _id: undefined }))
  })

  // Publish Subscription Data to Subscribers
  await pubsub.publish(SESSION_UPDATED, {
    [SESSION_UPDATED]: { ...resultObj, id: sessionId },
    sessionId,
  })
}

/**
 * If redis is in use, unlink the cached /join/:shortname pages
 * @param {*} shortname
 */
const cleanCache = (shortname) => {
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
const getRunningSession = async (sessionId) => {
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
 */
const mapBlocks = async ({ sessionId, questionBlocks, userId }) => {
  // initialize a store for newly created instance models
  let instances = []
  const promises = []

  const blocks = await Promise.all(
    questionBlocks
      .filter((block) => block.questions.length > 0)
      .map(async (block) => ({
        instances: await Promise.all(
          block.questions.map(async ({ question, version }) => {
            let questionVersion = version

            // if there is no valid defined version, look up the latest one
            if (questionVersion < 0) {
              const questionInfo = await QuestionModel.findById(question)
              questionVersion = questionInfo.versions.length - 1
              console.log(questionInfo, questionVersion)
            }

            // create a new question instance model
            const instance = new QuestionInstanceModel({
              question,
              session: sessionId,
              user: userId,
              version: questionVersion,
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
          })
        ),
      }))
  )

  return {
    blocks,
    instances,
    promises,
  }
}

/**
 * Parse the results hash object as extracted from redis into digestable results
 * @param {*} redisResults
 */
const choicesToResults = (redisResults) => {
  if (!redisResults) {
    return {
      CHOICES: [],
      totalParticipants: 0,
    }
  }

  // calculate the number of choices available
  const numChoices = Object.keys(redisResults).length - 1

  // hydrate the instance results
  return {
    CHOICES: new Array(numChoices).fill(0).map((_, i) => +redisResults[i]),
    totalParticipants: redisResults.participants,
  }
}

/**
 * Prase the results hash object as extracted from redis into digestable results
 * @param {*} redisResults
 * @param {*} responseHashes
 */
const freeToResults = (redisResults, responseHashes) => {
  if (!redisResults) {
    return {
      FREE: [],
      totalParticipants: 0,
    }
  }

  const results = redisResults

  // extract the total number of participants
  const totalParticipants = results.participants
  delete results.participants

  // hydrate the instance results
  return {
    FREE: _mapValues(results, (val, key) => ({ count: +val, value: responseHashes[key] })),
    totalParticipants,
  }
}

/**
 * Initialize the redis response cache as needed for session execution
 */
const initializeResponseCache = async ({ id, question, version, results }) => {
  const transaction = responseCache.multi()

  // extract relevant information from the question entity
  const questionVersion = question.versions[version]

  // set the instance status, opening the instance for responses
  transaction.hmset(`instance:${id}:info`, 'status', 'OPEN', 'type', question.type)
  transaction.hset(`instance:${id}:results`, 'participants', results ? results.totalParticipants : 0)

  // include the min/max restrictions in the cache for FREE_RANGE questions
  if (question.type === QUESTION_TYPES.FREE_RANGE && questionVersion.options.FREE_RANGE.restrictions) {
    transaction.hmset(
      `instance:${id}:info`,
      'min',
      questionVersion.options.FREE_RANGE.restrictions.min,
      'max',
      questionVersion.options.FREE_RANGE.restrictions.max
    )
  }

  // initialize results hash for SC and MC questions
  // FREE and FREE_RANGE will be initialized at runtime
  if (QUESTION_GROUPS.CHOICES.includes(question.type)) {
    // extract the options of the question
    const options = questionVersion.options.SC || questionVersion.options.MC

    // initialize all response counts to 0
    options.choices.forEach((_, index) => {
      transaction.hset(`instance:${id}:results`, index, results ? results.CHOICES[index] : 0)
    })
  } else if (results && QUESTION_GROUPS.FREE.includes(question.type)) {
    _forOwn(results.FREE, ({ count, value }, key) => {
      transaction.hset(`instance:${id}:results`, key, count)
      transaction.hset(`instance:${id}:responseHashes`, key, value)
    })
  }

  return transaction.exec()
}

/**
 * Compute the question instance results based on the redis response cache
 */
const computeInstanceResults = async ({ id, question }) => {
  // setup a transaction for result extraction from redis
  const redisResponse = await responseCache
    .multi()
    .hgetall(`instance:${id}:results`)
    .del(
      `instance:${id}:info`,
      `instance:${id}:results`,
      `instance:${id}:responses`,
      `instance:${id}:ip`,
      `instance:${id}:fp`
    )
    .exec()

  if (!redisResponse) {
    return null
  }

  const redisResults = redisResponse[0][1]

  if (QUESTION_GROUPS.CHOICES.includes(question.type)) {
    return choicesToResults(redisResults)
  }

  if (QUESTION_GROUPS.FREE.includes(question.type)) {
    // extract the response hashes from redis
    const responseHashes = (
      await responseCache.multi().hgetall(`instance:${id}:responseHashes`).del(`instance:${id}:responseHashes`).exec()
    )[0][1]

    return freeToResults(redisResults, responseHashes)
  }

  return null
}

function enhanceSessionParticipants({ sessionId, participants }) {
  // TODO: should we hash/salt the password? probably not, as the session creator needs to export them..
  return participants.map((participant) => ({
    session: sessionId,
    username: participant.username,
    password: passwordGenerator.generate({ length: 14, uppercase: true, symbols: false, numbers: true }),
  }))
}

/**
 * Create a new session
 */
const createSession = async ({ name, questionBlocks = [], participants = [], userId }) => {
  const sessionId = ObjectId()
  const { blocks, instances, promises } = await mapBlocks({
    sessionId,
    questionBlocks,
    userId,
  })

  // if there are any participants specified, set the session to be authentication-based
  const participantsWithPasswords = enhanceSessionParticipants({ sessionId, participants })

  // create a new session model
  // pass in the list of blocks created above
  const newSession = new SessionModel({
    _id: sessionId,
    name,
    blocks,
    user: userId,
    participants: participantsWithPasswords,
    settings: {
      isParticipantAuthenticationEnabled: participantsWithPasswords.length > 0,
    },
  })

  // save everything at once
  await Promise.all([
    ...promises,
    ...instances.map((instance) => instance.save()),
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
 */
const modifySession = async ({ id, name, questionBlocks, participants, userId }) => {
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
    const questionCleanup = oldInstances.map((instance) =>
      QuestionModel.findByIdAndUpdate(instance.question, {
        $pull: { instances: instance.id },
      })
    )

    // completely remove the instance entities
    const instanceCleanup = QuestionInstanceModel.deleteMany({
      _id: { $in: oldInstances },
    })

    // map the blocks
    const { blocks, instances, promises } = await mapBlocks({
      sessionId: id,
      questionBlocks,
      userId,
    })

    // replace the session blocks
    session.blocks = blocks

    // await all promises
    await Promise.all([...promises, instances.map((instance) => instance.save()), questionCleanup, instanceCleanup])
  }

  // if the participants parameter is set, update the participants list
  if (typeof participants !== 'undefined') {
    if (participants.length === 0) {
      session.participants = []
      session.settings.isParticipantAuthenticationEnabled = false
    } else {
      const participantsWithPassword = enhanceSessionParticipants({ sessionId: id, participants })
      session.participants = participantsWithPassword
      session.settings.isParticipantAuthenticationEnabled = true
    }
  }

  // save the updated session to the database
  await session.save()

  // return the updated session
  return session
}

/**
 * Generic session action handler (start, pause, stop...)
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

      // if the session is paused, reinitialize the redis cache with persisted results
      if (session.status === SESSION_STATUS.PAUSED && session.activeInstances.length > 0) {
        await Promise.all(
          session.activeInstances.map(async (instanceId) => {
            const instance = await QuestionInstanceModel.findById(instanceId).populate('question')
            await initializeResponseCache(instance)
          })
        )
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

      // if the session has active instances, persist the results
      if (session.activeInstances.length > 0) {
        await Promise.all(
          session.activeInstances.map(async (instanceId) => {
            const instance = await QuestionInstanceModel.findById(instanceId).populate('question')

            // persist the results of the paused instances
            instance.results = await computeInstanceResults(instance)

            return instance.save()
          })
        )
      }

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

    case SESSION_ACTIONS.RESET:
    case SESSION_ACTIONS.CANCEL:
      // if the session is not yet running, throw an error
      if (session.status === SESSION_STATUS.CREATED) {
        throw new ForbiddenError('SESSION_NOT_STARTED')
      }

      // Reset any session progress, in order to revert the session to its "CREATED" state.
      if (session.blocks.length > 0) {
        session.activeBlock = -1
        session.activeStep = 0
        session.activeInstances = []
        session.settings.isFeedbackChannelActive = false
        session.settings.isConfusionBarometerActive = false
        session.confusionTS = []
        session.feedbacks = []

        // increase the execution counter
        // invalidates user input in case a session is cancelled and repeated
        session.executions += 1

        const promises = []
        for (let i = 0; i < session.blocks.length; i += 1) {
          session.blocks[i].status = QUESTION_BLOCK_STATUS.PLANNED
          session.blocks[i].execution += 1
          session.blocks[i].expiresAt = null

          // reset any results that are already stored in the database
          promises.push(
            session.blocks[i].instances.map(async (instanceId) => {
              const instance = await QuestionInstanceModel.findById(instanceId)
              instance.isOpen = false
              instance.responses = []
              instance.results = null
              return instance.save()
            })
          )
        }

        await Promise.all(promises)
      }
      // update the session status to CREATED
      session.status = SESSION_STATUS.CREATED
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

  await publishSessionUpdate({ sessionId: session.id, activeBlock: session.activeBlock })

  sendSlackNotification('sessions', `${actionType} session at /join/${user.shortname}`)

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
 * Cancel a running session, reverting it to the "CREATED" state.
 * @param {*} param0
 */
const cancelSession = ({ id, userId, shortname }) =>
  sessionAction({ sessionId: id, userId, shortname }, SESSION_ACTIONS.CANCEL)

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

  await publishSessionUpdate({ sessionId: session.id, activeBlock: session.activeBlock })

  // return the updated session
  return session
}

const jobs = {}

async function deactivateBlockById({ userId, sessionId, blockId, incrementActiveStep, isScheduled }) {
  const user = await UserModel.findById(userId)
  const session = await SessionModel.findOne({ _id: sessionId, user: userId })

  if (!user || !session) {
    throw new ForbiddenError('INVALID_SESSION')
  }

  if (!isScheduled && jobs[blockId]) {
    await jobs[blockId].cancel()
  }

  // find the index of the block with the given id
  const blockIndex = session.blocks.findIndex((block) => block.id === blockId)

  // find the next block for the running session
  const oldBlock = session.blocks[blockIndex]

  // set the status of the previous block to executed
  session.blocks[blockIndex].status = QUESTION_BLOCK_STATUS.EXECUTED

  // reset the activeInstances of the current session
  session.activeInstances = []

  // increment the active step if the flag is passed
  if (incrementActiveStep) {
    session.activeStep += 1
  }

  // update the instances in the currently active block to be closed
  await Promise.all(
    oldBlock.instances.map(async (instanceId) => {
      const instance = await QuestionInstanceModel.findById(instanceId).populate('question')

      // set the instances to be open
      instance.isOpen = false

      // compute the instance results based on redis cache contents
      instance.results = await computeInstanceResults(instance)

      return instance.save()
    })
  )

  await session.save()

  // if redis is in use, cleanup the page cache
  if (redisCache) {
    await cleanCache(user.shortname)
  }

  if (isScheduled) {
    await publishRunningSessionUpdate({ sessionId })
  }

  await publishSessionUpdate({ sessionId, activeBlock: session.activeBlock })

  return session
}

async function activateBlockById({ userId, sessionId, blockId }) {
  const user = await UserModel.findById(userId)
  let session = await SessionModel.findOne({ _id: sessionId, user: userId })

  if (!user || !session) {
    throw new ForbiddenError('INVALID_SESSION')
  }

  // deactivate the previous block if one has been active already
  if (session.activeBlock > -1 && session.activeStep === session.activeBlock * 2 + 1) {
    session = await deactivateBlockById({ userId, sessionId, blockId: session.blocks[session.activeBlock].id })
  }

  // find the index of the block with the given id
  const blockIndex = session.blocks.findIndex((block) => block.id === blockId)

  // find the next block for the running session
  const newBlock = session.blocks[blockIndex]

  // if the newly activated block has been executed before, rehydrate the cache
  if (newBlock.status === QUESTION_BLOCK_STATUS.EXECUTED) {
    await Promise.all(
      newBlock.instances.map(async (instance) => {
        const instanceWithDetails = await QuestionInstanceModel.findById(instance).populate('question')
        return initializeResponseCache(instanceWithDetails)
      })
    )
  }

  // set the status of the instances in the next block to active
  session.blocks[blockIndex].status = QUESTION_BLOCK_STATUS.ACTIVE

  // set the instances of the next block to be the users active instances
  session.activeInstances = newBlock.instances

  // update the active block and step
  session.activeBlock = blockIndex
  session.activeStep = blockIndex * 2 + 1

  // update the instances in the new active block to be open
  await Promise.all(
    newBlock.instances.map(async (instanceId) => {
      const instance = await QuestionInstanceModel.findById(instanceId).populate('question')

      // set the instances to be open
      instance.isOpen = true

      // if a response cache is available, hydrate it with the newly activated instances
      if (responseCache) {
        await initializeResponseCache(instance)
      }

      return instance.save()
    })
  )

  // check whether the next block has a time limit
  if (session.blocks[blockIndex].timeLimit > -1) {
    // set expiresAt for time-limited blocks
    session.blocks[blockIndex].expiresAt = dayjs().add(session.blocks[blockIndex].timeLimit, 'second')

    // schedule the activation of the next block
    jobs[blockId] = schedule.scheduleJob(session.blocks[blockIndex].expiresAt, async () => {
      await deactivateBlockById({
        userId,
        sessionId: session.id,
        blockId,
        incrementActiveStep: true,
        isScheduled: true,
      })
    })
  }

  await session.save()

  // if redis is in use, cleanup the page cache
  if (redisCache) {
    await cleanCache(user.shortname)
  }

  await publishSessionUpdate({ sessionId, activeBlock: session.activeBlock })

  return session
}

/**
 * Activate the next question block of a running session
 */
const activateNextBlock = async ({ userId }) => {
  const user = await UserModel.findById(userId).populate('runningSession')

  const { runningSession } = user

  if (!runningSession) {
    throw new ForbiddenError('NO_RUNNING_SESSION')
  }

  // if all the blocks have already been activated, simply return the session
  if (runningSession.activeBlock === runningSession.blocks.length) {
    return user.runningSession
  }

  const prevBlockIndex = runningSession.activeBlock
  const nextBlockIndex = runningSession.activeBlock + 1

  let updatedSession
  if (runningSession.activeInstances.length === 0) {
    // find the next block for the running session
    const nextBlock = runningSession.blocks[nextBlockIndex]

    // activate the next block
    updatedSession = await activateBlockById({ userId, sessionId: runningSession.id, blockId: nextBlock.id })
  } else if (runningSession.activeBlock >= 0) {
    // find the currently active block
    const previousBlock = runningSession.blocks[prevBlockIndex]

    updatedSession = await deactivateBlockById({
      userId,
      sessionId: runningSession.id,
      blockId: previousBlock.id,
      incrementActiveStep: true,
    })
  }

  return updatedSession || user.runningSession
}

/**
 * Delete a session
 * @param {*} param0
 */
const deleteSessions = async ({ userId, ids }) => {
  // get the session from the database
  const sessions = await SessionModel.find({ _id: { $in: ids }, user: userId }).populate('blocks.instances')

  await Promise.all(
    sessions.map((session) => {
      // compute the list of question instances used in this session
      const instances = session.blocks.reduce((acc, block) => [...acc, ...block.instances], [])
      const instanceIds = instances.map((instance) => instance.id)

      // delete the session and all related question instances
      // remove the session from the user model
      return Promise.all([
        SessionModel.deleteOne({ _id: session.id, user: userId }),
        QuestionInstanceModel.deleteMany({
          _id: { $in: instanceIds },
          user: userId,
        }),
        Promise.all(
          instances.map((instance) =>
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

async function modifyQuestionBlock({ sessionId, id, questionBlockSettings, userId }) {
  const session = await SessionModel.findOne({ _id: sessionId, user: userId })
  if (!session) {
    throw new ForbiddenError('INVALID_QUESTION_BLOCK')
  }

  const blockIndex = session.blocks.findIndex((block) => block.id === id)
  if (blockIndex < 0) {
    return session
  }

  session.blocks[blockIndex].timeLimit = questionBlockSettings.timeLimit

  return session.save()
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
  cancelSession,
  deleteSessions,
  choicesToResults,
  freeToResults,
  cleanCache,
  publishSessionUpdate,
  modifyQuestionBlock,
  activateBlockById,
}
