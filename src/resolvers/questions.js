const QuestionService = require('../services/questions')
const { QuestionModel, QuestionInstanceModel, UserModel } = require('../models')

/* ----- queries ----- */
const allQuestionsQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate({ path: 'questions' })
  return user.questions
}

const questionByIDQuery = (parentValue, { id }) => QuestionModel.findById(id)
const questionByPVQuery = parentValue => QuestionModel.findById(parentValue.question)
const questionsByPVQuery = parentValue => parentValue.questions.map(id => questionByIDQuery(parentValue, { id }))

const questionInstanceByIDQuery = (parentValue, { id }) => QuestionInstanceModel.findById(id)
const questionInstancesByPVQuery = parentValue =>
  parentValue.instances.map(id => questionInstanceByIDQuery(parentValue, { id }))

/* ----- mutations ----- */
const createQuestionMutation = (parentValue, { question }, { auth }) =>
  QuestionService.createQuestion({ ...question, userId: auth.sub })

module.exports = {
  // queries
  allQuestions: allQuestionsQuery,
  question: questionByIDQuery,
  questionByPV: questionByPVQuery,
  questionsByPV: questionsByPVQuery,
  questionInstance: questionInstanceByIDQuery,
  questionInstancesByPV: questionInstancesByPVQuery,

  // mutations
  createQuestion: createQuestionMutation,
}
