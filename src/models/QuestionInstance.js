const mongoose = require('mongoose')

/*
  id: ID!
  questionDefinition: QuestionDefinition!
  questionVersion: QuestionVersion!
  responses: [Json]
  createdAt: Date
  updatedAt: Date
*/

const QuestionInstance = new mongoose.Schema({

})

module.exports = mongoose.model('QuestionInstance', QuestionInstance)
