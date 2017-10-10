const mongoose = require('mongoose')

const ConfusionTimestep = new mongoose.Schema({
  difficulty: {
    type: Number,
    default: 0,
    min: -50,
    max: 50,
  },
  speed: {
    type: Number,
    default: 0,
    min: -50,
    max: 50,
  },

  createdAt: { type: Date, default: Date.now() },
})

module.exports = ConfusionTimestep
