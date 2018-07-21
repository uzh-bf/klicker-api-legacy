/* eslint-disable no-use-before-define */

// TODO: ensure that the password can never be read

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [User, Question, Session, Tag]

const Question = require('./Question')
const Session = require('./Session')
const Tag = require('./Tag')

const User = `
  input UserInput {
    email: String
    password: String
    shortname: String
    institution: String
    useCase: String
  }
  type User {
    id: ID!
    email: String!
    isActive: Boolean!
    isAAI: Boolean!
    shortname: String!
    institution: String
    useCase: String

    runningSession: Session

    questions: [Question!]!
    sessions: [Session!]!
    tags: [Tag!]!
    files: [File!]!

    createdAt: String!
    updatedAt: String!
  }
`
