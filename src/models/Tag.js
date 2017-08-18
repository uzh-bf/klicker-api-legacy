// @flow

/*
  id: ID!
  name: String!
  questions: [QuestionDefinition]
  createdAt: Date
  updatedAt: Date
*/

const mongoose = require('mongoose')

const Tag = new mongoose.Schema({
  name: String,
  createdAt: Date,
  updatedAt: Date,
})

module.exports = Tag
// module.exports = mongoose.model('Tag', Tag)

