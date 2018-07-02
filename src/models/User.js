const mongoose = require('mongoose')
const { isAlphanumeric, isEmail, normalizeEmail } = require('validator')

const { ObjectId } = mongoose.Schema.Types

const User = new mongoose.Schema({
  // define email as unique (not a validator, only for index)
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      message: 'INVALID_EMAIL',
      validator: isEmail,
    },
  },
  password: { type: String, required: true },
  shortname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 8,
    index: true,
    unique: true,
    validate: {
      message: 'INVALID_SHORTNAME',
      validator: isAlphanumeric,
    },
  },
  institution: {
    type: String,
  },
  useCase: {
    type: String,
  },
  isActive: { type: Boolean, default: false },
  isAAI: { type: Boolean, default: false },
  isMigrated: { type: Boolean, default: false },

  tags: [{ type: ObjectId, ref: 'Tag' }],
  questions: [{ type: ObjectId, ref: 'Question' }],
  sessions: [{ type: ObjectId, ref: 'Session' }],

  runningSession: { type: ObjectId, ref: 'Session' },

  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

User.pre('save', true, async () => {
  // ensure the email is properly normalized
  this.email = normalizeEmail(this.email)
})

module.exports = mongoose.model('User', User)
