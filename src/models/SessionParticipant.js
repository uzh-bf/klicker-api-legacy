const mongoose = require('mongoose')

const { ObjectId } = mongoose.Schema.Types

module.exports = new mongoose.Schema({
  // the session that the participant belongs to
  session: { type: ObjectId, ref: 'Session', required: true },

  // the username of the participant
  username: { type: String, required: true },

  // the credential of the participant
  // either a shibRef (e.g., AAI email) or a password
  shibRef: { type: String },
  password: { type: String },

  instances: [{ type: ObjectId, ref: 'QuestionInstance' }],
})
