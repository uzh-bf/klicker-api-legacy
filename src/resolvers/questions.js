const QuestionService = require('../services/questions')
const { QuestionModel, UserModel } = require('../models')

/* ----- queries ----- */
const allQuestionsQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate({ path: 'questions' })
  return user.questions
}
const questionQuery = async (parentValue, { id }, { auth }) => QuestionModel.findOne({ _id: id, user: auth.sub })

const questionByPVQuery = parentValue => QuestionModel.findById(parentValue.question)
const questionsByPVQuery = parentValue => QuestionModel.find({ _id: { $in: parentValue.questions } })

/* ----- mutations ----- */
const createQuestionMutation = (parentValue, { question }, { auth }) =>
  QuestionService.createQuestion({ ...question, userId: auth.sub })

const modifyQuestionMutation = (parentValue, { question }, { auth }) =>
  QuestionService.modifyQuestion(question.id, auth.sub, question)

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
