const mongoose = require('mongoose')

// for SC and MC questions, define the choices and related settings
const Choice = new mongoose.Schema({
  correct: { type: Boolean, required: true },
  name: { type: String, required: true },
})

const ChoiceOptions = new mongoose.Schema({
  choices: [{ type: Choice, required: true }],
  randomized: { type: Boolean, default: false },
})

// for FREE questions, define optional restrictions
const Restrictions = new mongoose.Schema({
  min: { type: Number },
  max: { type: Number },
})

module.exports = {
  QuestionOptions: new mongoose.Schema({
    choices: [{ type: Choice }],
    randomized: { type: Boolean, default: false },
    restrictions: { type: Restrictions },
    SC: { type: ChoiceOptions },
    MC: { type: ChoiceOptions },
    FREE_RANGE: { type: Restrictions },
  }),
}
