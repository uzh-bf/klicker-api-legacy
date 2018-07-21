const mongoose = require('mongoose')

const { ObjectId } = mongoose.Schema.Types

const File = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['png', 'jpeg', 'gif'],
    required: true,
    index: true,
  },

  question: {
    type: ObjectId,
    ref: 'Question',
    required: true,
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
})

module.exports = {
  FileModel: mongoose.model('File', File),
}
