const mongoose = require('mongoose')
const _values = require('lodash/values')

const { ObjectId } = mongoose.Schema.Types

const { QUESTION_TYPES } = require('../constants')
const QuestionVersion = require('./QuestionVersion')

const Question = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: _values(QUESTION_TYPES),
    required: true,
    index: true,
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },

  versions: [{ type: QuestionVersion, required: true }],
  instances: [{ type: ObjectId, ref: 'QuestionInstance' }],
  tags: [{ type: ObjectId, ref: 'Tag', required: true }],

  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

module.exports = {
  QuestionModel: mongoose.model('Question', Question),
}
