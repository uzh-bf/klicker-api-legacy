/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [FREEQuestionResults]

const FREEQuestionResults = `
  type FREEQuestionResults_Result {
    count: Int!
    text: String
    value: Int
  }

  type FREEQuestionResults {
    free: [FREEQuestionResults_Result!]!
  }
`
