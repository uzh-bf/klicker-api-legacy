/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [Tag, Question]

const Question = require('./Question')

const Tag = `
  type Tag {
    id: ID!

    name: String!
    user: User!

    questions: [Question]!

    createdAt: String!
    updatedAt: String!
  }

  input TagInput {
    name: String!
    question: ID!
  }
`
