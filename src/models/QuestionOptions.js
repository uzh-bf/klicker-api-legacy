const mongoose = require('mongoose')

// for SC and MC questions, define the choices and related settings
const Choices = new mongoose.Schema({
  items: [
    {
      key: { type: Number, min: 0, required: true },
      correct: { type: Boolean, required: true },
      name: { type: String, required: false },
    },
  ],
  randomized: {
    type: Boolean,
    default: false,
  },
})

// for FREE questions, define optional restrictions
const Restrictions = new mongoose.Schema({
  min: { type: Number },
  max: { type: Number },
  // RANGE: numerical range with defined min and/or max values
  kind: { type: String, enum: ['RANGE'] },
})

module.exports = new mongoose.Schema({
  choices: { type: Choices },
  restrictions: { type: Restrictions },
})
