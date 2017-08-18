// @flow

/*
  id: ID!
  name: String!
  blocks: [QuestionBlock]!
  feedbacks: [Feedback]
  confusionTS: [ConfusionTimeStep]
  status: Enum!
  settings: Json!
  isFeedbackChannelActive: Boolean (false)
  isFeedbackChannelPublic: Boolean (false)
  isConfusionBarometerActive: Boolean (false)
  createdAt: Date
  updatedAt: Date
*/

const mongoose = require('mongoose')

const ConfusionTimeStep = require('./ConfusionTimeStep')
const Feedback = require('./Feedback')
const QuestionBlock = require('./QuestionBlock')

const Session = new mongoose.Schema({
  name: { type: String, default: Date.now(), index: true },
  status: { type: Number, default: 0, min: 0, max: 2, index: true }, // 0: CREATED, 1: RUNNING, 2: COMPLETED
  settings: {
    isConfusionBarometerActive: { type: Boolean, default: false },
    isFeedbackChannelActive: { type: Boolean, default: false },
    isFeedbackChannelPublic: { type: Boolean, default: false },
  },

  blocks: [QuestionBlock],
  confusionTS: [ConfusionTimeStep],
  feedbacks: [Feedback],

  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

module.exports = mongoose.model('Session', Session)
