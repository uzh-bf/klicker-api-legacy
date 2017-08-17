// @flow

const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  shortname: String,
  isActive: Boolean,
  isAAI: Boolean,
  tags: [{ type: String }],
  createdAt: Date,
  updatedAt: Date,
})

module.exports = mongoose.model('User', UserSchema)

