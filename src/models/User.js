// @flow

/*
  id: ID!
  email: String!
  password: String!
  shortname: String!
  isActive: boolean (false)
  isAAI: boolean (false)
  tags: [Tag]
  questions: [QuestionDefinition]
  sessions: [Session]
  createdAt: Date
  updatedAt: Date
*/

const mongoose = require('mongoose')

const Tag = require('./Tag')

const User = new mongoose.Schema({
  email: String,
  password: String,
  shortname: String,
  isActive: Boolean,
  isAAI: Boolean,
  tags: [{ type: Tag }],
  questions: [{ type: Question }],
  sessions: [{ type: Session }],
  createdAt: Date,
  updatedAt: Date,
})

module.exports = mongoose.model('User', User)

