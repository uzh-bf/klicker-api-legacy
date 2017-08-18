// @flow

/*
  id: ID!
  questions: [QuestionInstance]!
  status: Enum!
  timeLimit: Number
  showSolutions: Boolean (false)
  createdAt: Date
  updatedAt: Date
*/

const mongoose = require('mongoose')

const ObjectId = mongoose.Schema.Types.ObjectId

const QuestionBlock = new mongoose.Schema({
  status: { type: Number, default: 0, min: 0, max: 2 }, // 0: PLANNED, 1: ACTIVE, 2: EXECUTED
  timeLimit: { type: Number, default: -1, min: -1 },
  showSolutions: { type: Boolean, default: false },

  questions: [{ type: ObjectId, ref: 'QuestionInstance' }],

  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

module.exports = QuestionBlock
// module.exports = mongoose.model('QuestionBlock', QuestionBlock)
