const { QuestionInstanceModel, SessionModel, UserModel } = require('../models')

const createSession = async ({ name, questionBlocks, user }) => {
  // initialize a store for newly created instance models
  let instances = []

  // pass through all the question block in params
  // create question instances for all questions within
  const blocks = questionBlocks.map(block => ({
    questions: block.questions.map((question) => {
      // create a new question instance model
      const instance = new QuestionInstanceModel({
        question: question.id,
        user,
        version: 0,
      })

      // append the new question instance to the store
      instances = [...instances, instance]

      // return only the id of the new instance
      return instance.id
    }),
  }))

  // create a new session model
  // pass in the list of blocks created above
  const newSession = new SessionModel({
    name,
    blocks,
    user,
  })

  // save everything at once
  await Promise.all([
    ...instances.map(instance => instance.save()),
    newSession.save(),
    UserModel.update(
      { _id: user },
      {
        $push: { sessions: newSession.id },
        $currentDate: { updatedAt: true },
      },
    ),
  ])

  return newSession
}

const startSession = () => ({})

module.exports = {
  createSession,
  startSession,
}
