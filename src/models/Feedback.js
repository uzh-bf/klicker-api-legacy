const mongoose = require('mongoose')

module.exports = new mongoose.Schema(
  {
    content: { type: String, required: true },
    tags: [{ type: String }],
    votes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)
