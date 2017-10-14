/* eslint-disable no-use-before-define */

// TODO: ensure that the password can never be read

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [User, Question, Session, Tag]

const Question = require('./Question')
const Session = require('./Session')
const Tag = require('./Tag')

const User = `
  type User {
    id: ID!

    email: String!
    isActive: Boolean!
    isAAI: Boolean!
    shortname: String!

    questions: [Question]!
    sessions: [Session]!
    tags: [Tag]!

    runningSession: Session

    createdAt: String!
    updatedAt: String!
  }

  input UserInput {
    email: String
    password: String
    shortname: String
  }
`
