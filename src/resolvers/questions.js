const QuestionService = require('../services/questions')
const { QuestionModel } = require('../models')

/* ----- queries ----- */
const allQuestionsQuery = async (parentValue, args, { auth }) =>
  QuestionModel.find({ user: auth.sub }).sort({ createdAt: -1 })

const questionQuery = async (parentValue, { id }, { loaders }) => loaders.questions.load(id)
const questionByPVQuery = (parentValue, args, { loaders }) => loaders.questions.load(parentValue.question)
const questionsByPVQuery = (parentValue, args, { loaders }) => loaders.questions.loadMany(parentValue.questions)

/* ----- mutations ----- */
const createQuestionMutation = (parentValue, { question }, { auth }) =>
  QuestionService.createQuestion({ ...question, userId: auth.sub })

const modifyQuestionMutation = (parentValue, { id, question }, { auth }) =>
  QuestionService.modifyQuestion(id, auth.sub, question)

module.exports = {
  // queries
  allQuestions: allQuestionsQuery,
  question: questionQuery,
  questionByPV: questionByPVQuery,
  questionsByPV: questionsByPVQuery,

  // mutations
  createQuestion: createQuestionMutation,
  modifyQuestion: modifyQuestionMutation,
}
