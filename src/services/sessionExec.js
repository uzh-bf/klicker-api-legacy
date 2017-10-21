const { QuestionInstanceModel, QuestionTypes } = require('../models')

const { getRunningSession } = require('./sessionMgr')

// add a new feedback to a session
const addFeedback = async ({ sessionId, content }) => {
  // TODO: security
  // TODO: rate limiting
  // TODO: ...

  const session = await getRunningSession(sessionId)

  // if the feedback channel is not activated, do not allow new additions
  if (!session.settings.isFeedbackChannelActive) {
    throw new Error('SESSION_FEEDBACKS_DEACTIVATED')
  }

  // push a new feedback into the array
  session.feedbacks.push({ content })

  // save the updated session
  await session.save()

  // return the updated session
  return session
}

// add a new confusion timestep to the session
const addConfusionTS = async ({ sessionId, difficulty, speed }) => {
  // TODO: security
  // TODO: rate limiting
  // TODO: ...

  const session = await getRunningSession(sessionId)

  // if the confusion barometer is not activated, do not allow new additions
  if (!session.settings.isConfusionBarometerActive) {
    throw new Error('SESSION_CONFUSION_DEACTIVATED')
  }

  // push a new timestep into the array
  session.confusionTS.push({ difficulty, speed })

  // save the updated session
  await session.save()

  // return the updated session
  return session
}

// add a response to an active question instance
const addResponse = async ({ instanceId, response }) => {
  // find the specified question instance
  // only find instances that are open
  const instance = await QuestionInstanceModel.findOne({ _id: instanceId, isOpen: true }).populate('question')

  // if the instance is closed, don't allow adding any responses
  if (!instance) {
    throw new Error('INSTANCE_CLOSED')
  }

  const questionType = instance.question.type

  // result parsing for FREE questions
  if (questionType === QuestionTypes.FREE) {
    // TODO: init
  }

  // result parsing for SC/MC questions
  if ([QuestionTypes.SC, QuestionTypes.MC].includes(questionType)) {
    // if the results have not yet been initialized
    if (!instance.results) {
      instance.results = {
        choices: new Array(instance.question.versions[instance.version].options.choices.length).fill(0),
      }
    }

    // for each choice given, update the results
    response.choices.forEach((responseIndex) => {
      instance.results.choices[responseIndex] += 1
    })
  }

  // push the new response into the array
  // TODO: redis for everything in here...
  // TODO: save the IP and fingerprint of the responder and validate
  instance.responses.push({
    ip: 'some ip',
    fingerprint: 'some fingerprint',
    value: response,
  })

  // save the updated instance
  await instance.save()

  // return the updated instance
  return instance
}

module.exports = {
  getRunningSession,
  addResponse,
  addConfusionTS,
  addFeedback,
}
