const mongoose = require('mongoose')

module.exports = new mongoose.Schema({
  key: { type: Number, min: 0, required: true },
  content: { type: String, required: true },
  votes: { type: Number, default: 0, min: 0 },

  createdAt: { type: Date, default: Date.now() },
})
