// @flow

/*
  id: ID!
  content: String!
  votes: Number (0)
  createdAt: Date
*/

const mongoose = require('mongoose')

const Feedback = new mongoose.Schema({
  content: { type: String, required: true },
  votes: { type: Number, default: 0, min: 0 },

  createdAt: { type: Date, default: Date.now() },
})

module.exports = Feedback
// module.exports = mongoose.model('Feedback', Feedback)
