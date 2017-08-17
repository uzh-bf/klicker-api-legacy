// @flow

const mongoose = require('mongoose')

const TagSchema = new mongoose.Schema({
  name: String,
  questions: [],
  createdAt: Date,
  updatedAt: Date,
})

module.exports = mongoose.model('Tag', TagSchema)

