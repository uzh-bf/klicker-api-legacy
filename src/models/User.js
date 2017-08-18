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

const ObjectId = mongoose.Schema.Types.ObjectId

const User = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true }, // define as unique (not a validator, only for index)
  password: { type: String, required: true },
  shortname: { type: String, required: true, minlength: 3, maxlength: 6, index: true },
  isActive: { type: Boolean, default: false },
  isAAI: { type: Boolean, required: true },

  tags: [{ type: ObjectId, ref: 'Tag' }],
  questions: [{ type: ObjectId, ref: 'Question' }],
  sessions: [{ type: ObjectId, ref: 'Session' }],

  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

module.exports = mongoose.model('User', User)
