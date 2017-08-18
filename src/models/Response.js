// @flow

/*
  id: ID!
  value: Object!
  createdAt: Date
*/

const mongoose = require('mongoose')

const Response = new mongoose.Schema({
  value: { type: Object, required: true },

  createdAt: { type: Date, default: Date.now() },
})

module.exports = Response
// module.exports = mongoose.model('Response', Response)
