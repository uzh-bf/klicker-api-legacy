/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [FREEQuestionOptions]

const FREEQuestionOptions = `
  enum FREEQuestionOptions_RestrictionKind {
    RANGE
  }

  type FREEQuestionOptions {
    restrictions: FREEQuestionOptions_Restrictions!
  }

  type FREEQuestionOptions_Restrictions {
    kind: FREEQuestionOptions_RestrictionKind!
    min: Int
    max: Int
  }

  input FREEQuestionOptionsInput {
    restrictions: FREEQuestionOptions_RestrictionsInput!
  }

  input FREEQuestionOptions_RestrictionsInput {
    kind: FREEQuestionOptions_RestrictionKind!
    min: Int
    max: Int
  }
`
