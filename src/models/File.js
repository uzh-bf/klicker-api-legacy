const mongoose = require('mongoose')

const { ObjectId } = mongoose.Schema.Types

const File = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  type: { type: String, required: true, index: true },
  version: { type: Number, required: true, default: 0 },

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
