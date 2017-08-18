const mongoose = require('mongoose')

/*
  id: ID!
  description: String!
  options: Json!
  solution: Json
  instances: [QuestionInstance]
  createdAt: Date
  updatedAt: Date
*/

const QuestionVersion = new mongoose.Schema({

})

module.exports = QuestionVersion
// module.exports = mongoose.model('QuestionVersion', QuestionVersion)
