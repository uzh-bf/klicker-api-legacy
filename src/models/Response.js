const mongoose = require('mongoose')

module.exports = new mongoose.Schema({
  key: { type: Number, min: 0, required: true },
  value: { type: Object, required: true },

  createdAt: { type: Date, default: Date.now() },
})
