const QuestionService = require('../services/questions')
const { QuestionModel, QuestionInstanceModel, UserModel } = require('../models')

/* ----- queries ----- */
const allQuestionsQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate({ path: 'questions' })
  return user.questions
}

const questionQuery = (parentValue, { id }) => QuestionModel.findById(id)
const questionsQuery = parentValue => parentValue.questions.map(id => questionQuery(parentValue, { id }))

const questionInstanceQuery = (parentValue, { id }) => QuestionInstanceModel.findById(id)
const questionInstancesQuery = parentValue =>
  parentValue.instances.map(id => questionInstanceQuery(parentValue, { id }))

/* ----- mutations ----- */
const createQuestionMutation = (parentValue, { question }, { auth }) =>
  QuestionService.createQuestion({ ...question, userId: auth.sub })

module.exports = {
  allQuestions: allQuestionsQuery,
  createQuestion: createQuestionMutation,
  question: questionQuery,
  questions: questionsQuery,
  questionInstance: questionInstanceQuery,
  questionInstances: questionInstancesQuery,
}
