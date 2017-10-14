/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [FREEQuestionOptions]

const FREEQuestionOptions = `
  enum FREEQuestionOptions_RestrictionKind {
    RANGE
  }

  input FREEQuestionOptionsInput {
    restrictions: FREEQuestionOptions_RestrictionsInput!
  }
  type FREEQuestionOptions {
    restrictions: FREEQuestionOptions_Restrictions!
  }

  input FREEQuestionOptions_RestrictionsInput {
    min: Int
    max: Int

    kind: FREEQuestionOptions_RestrictionKind!
  }
  type FREEQuestionOptions_Restrictions {
    min: Int
    max: Int

    kind: FREEQuestionOptions_RestrictionKind!
  }
`
