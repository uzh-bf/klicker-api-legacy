const DataLoader = require('dataloader')
const {
  QuestionInstanceModel, SessionModel, QuestionModel, TagModel,
} = require('../models')

const createMapping = (arr) => {
  const mapping = {}
  arr.forEach((item) => {
    mapping[item.id] = item
  })
  return mapping
}

const tagsLoader = auth =>
  new DataLoader(async (tagIds) => {
    console.log('tagsLoader: Loading tags...')

    const results = await TagModel.find({ _id: { $in: tagIds }, user: auth.sub })
    const mapping = createMapping(results)

    return tagIds.map(tagId => mapping[tagId])
  })

const questionsLoader = auth =>
  new DataLoader(async (questionIds) => {
    console.log('questionsLoader: Loading questions...')

    const results = await QuestionModel.find({ _id: { $in: questionIds }, user: auth.sub })
    const mapping = createMapping(results)

    return questionIds.map(questionId => mapping[questionId])
  })

const questionInstancesLoader = auth =>
  new DataLoader(async (questionInstanceIds) => {
    console.log('questionInstancesLoader: Loading questionInstances...')

    const results = await QuestionInstanceModel.find({ _id: { $in: questionInstanceIds }, user: auth.sub })
    const mapping = createMapping(results)

    return questionInstanceIds.map(instanceId => mapping[instanceId])
  })

const sessionsLoader = auth =>
  new DataLoader(async (sessionIds) => {
    console.log('sessionsLoader: Loading sessions...')

    const results = await SessionModel.find({ _id: { $in: sessionIds }, user: auth.sub })
    const mapping = createMapping(results)

    return sessionIds.map(sessionId => mapping[sessionId])
  })

function createLoaders(auth) {
  console.log(`Creating loaders for ${auth && auth.sub}`)

  if (!auth) {
    return {}
  }

  return {
    questions: questionsLoader(auth),
    questionInstances: questionInstancesLoader(auth),
    sessions: sessionsLoader(auth),
    tags: tagsLoader(auth),
  }
}

module.exports = {
  createLoaders,
  questions: questionsLoader,
  questionInstances: questionInstancesLoader,
  sessions: sessionsLoader,
  tags: tagsLoader,
}
