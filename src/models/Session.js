const mongoose = require('mongoose')

/*
  id: ID!
  name: String!
  blocks: [QuestionBlock]!
  feedbacks: [Feedback]
  confusionTS: [ConfusionTimeStep]
  status: Enum!
  settings: Json!
  isFeedbackChannelActive: Boolean (false)
  isFeedbackChannelPublic: Boolean (false)
  isConfusionBarometerActive: Boolean (false)
  createdAt: Date
  updatedAt: Date
*/

const Session = new mongoose.Schema({

})

module.exports = mongoose.model('Session', Session)
