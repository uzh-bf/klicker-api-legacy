const mongoose = require('mongoose')

/*
  id: ID!
  questions: [QuestionInstance]!
  status: Enum!
  timeLimit: Number
  showSolutions: Boolean (false)
  createdAt: Date
  updatedAt: Date
*/

const QuestionBlock = new mongoose.Schema({

})

module.exports = QuestionBlock
// module.exports = mongoose.model('QuestionBlock', QuestionBlock)
