const mongoose = require('mongoose')

/*
  id: ID!
  title: String!
  type: Enum!
  versions: [QuestionVersion]
  instances: [QuestionInstances]
  tags: [Tag]
  createdAt: Date
  updatedAt: Date
*/

const Question = new mongoose.Schema({

})

module.exports = mongoose.model('Question', Question)
