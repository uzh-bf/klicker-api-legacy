const AuthService = require('../services/auth')
const { QuestionModel, TagModel, UserModel } = require('../models')

/* ----- queries ----- */
const allQuestionsQuery = async (parentValue, args, { auth }) => {
  AuthService.isAuthenticated(auth)

  const user = await UserModel.findById(auth.sub).populate(['questions'])
  return user.questions
}

const questionQuery = (parentValue, { id }, { auth }) => {
  AuthService.isAuthenticated(auth)

  return QuestionModel.findOne({ id, user: auth.sub })
}

/* ----- mutations ----- */
const createQuestionMutation = async (parentValue, { question: { tags, title, type } }, { auth }) => {
  AuthService.isAuthenticated(auth)

  // if non-existent tags are passed, they need to be created
  // const fetchTags = await TagModel.find({ _id: { $in: tags } })

  const newQuestion = await new QuestionModel({
    tags: [],
    title,
    type,
  }).save()

  await UserModel.update(
    { _id: auth.sub },
    {
      $push: { questions: newQuestion.id },
      $currentDate: { updatedAt: true },
    },
  )

  return newQuestion
}

module.exports = {
  allQuestions: allQuestionsQuery,
  createQuestion: createQuestionMutation,
  question: questionQuery,
}
