const { QuestionInstanceModel, UserModel } = require('../models')

/* ----- queries ----- */
const activeInstanceQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate('activeInstance')
  return user.activeInstance
}

const questionInstanceByIDQuery = (parentValue, { id }) => QuestionInstanceModel.findById(id)
const questionInstancesByPVQuery = parentValue =>
  QuestionInstanceModel.find({ _id: { $in: parentValue.instances } })

/* ----- mutations ----- */
const addResponseMutation = () => {}

module.exports = {
  // queries
  activeInstance: activeInstanceQuery,
  questionInstance: questionInstanceByIDQuery,
  questionInstancesByPV: questionInstancesByPVQuery,

  // mutations
  addResponse: addResponseMutation,
}
