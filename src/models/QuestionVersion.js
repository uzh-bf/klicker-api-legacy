const mongoose = require('mongoose')

const { ObjectId } = mongoose.Schema.Types

const QuestionOption = require('./QuestionOption')

const QuestionVersion = new mongoose.Schema({
  description: { type: String, required: true },
  options: [{ type: QuestionOption, required: true }],
  solution: { type: Object, required: true },

  instances: [{ type: ObjectId, ref: 'QuestionInstance' }],

  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

module.exports = QuestionVersion
