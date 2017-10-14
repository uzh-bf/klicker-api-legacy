/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [SCQuestionOptions]

const SCQuestionOptions = `
  type SCQuestionOptions {
    choices: [SCQuestionOptions_Choice]!
    randomized: Boolean!
  }

  type SCQuestionOptions_Choice {
    key: Int!
    correct: Boolean!
    name: String!
  }

  input SCQuestionOptionsInput {
    choices: [SCQuestionOptions_ChoiceInput]!
    randomized: Boolean
  }

  input SCQuestionOptions_ChoiceInput {
    correct: Boolean!
    name: String!
  }
`
