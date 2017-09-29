const QuestionService = require('../services/questions')
const { QuestionModel, UserModel } = require('../models')

/* ----- queries ----- */
const allQuestionsQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate({ path: 'questions' })
  return user.questions
}

const questionQuery = (parentValue, { id }) => QuestionModel.findById(id)
const questionsQuery = (parentValue, args, context) =>
  parentValue.questions.map(id => questionQuery(parentValue, { id }, context))

/* ----- mutations ----- */
const createQuestionMutation = (parentValue, { question }, { auth }) =>
  QuestionService.createQuestion({ ...question, userId: auth.sub })

module.exports = {
  allQuestions: allQuestionsQuery,
  createQuestion: createQuestionMutation,
  question: questionQuery,
  questions: questionsQuery,
}
