/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [QuestionInstance]

const QuestionInstance = `
  enum QuestionInstance_Status {
    CLOSED
    OPEN
  }

  input QuestionInstance_ResponseInput {
    value: String!
  }
  type QuestionInstance_Response {
    id: ID!
    value: String!
    createdAt: String!
  }

  type QuestionInstance {
    id: ID!
    version: Int!
    status: QuestionInstance_Status!

    question: Question!

    responses: [QuestionInstance_Response!]!

    createdAt: String!
    updatedAt: String!
  }
`
