// @flow

const { makeExecutableSchema } = require('graphql-tools')

const { QuestionModel, SessionModel, TagModel, UserModel } = require('../models')

// create graphql schema in schema language
const typeDefs = `
  type Question {
    id: ID
  }

  type Session {
    id: ID
  }

  type Tag {
    id: ID
  }

  type User {
    id: ID
    email: String
    shortname: String

    isActive: Boolean
    isAAI: Boolean

    questions: [Question]
    sessions: [Session]
    tags: [Tag]

    createdAt: String
    updatedAt: String
  }


  type Query {
    allQuestions: [Question]
    allSessions: [Session]
    allTags: [Tag]
    user(id: ID): User
  }

  type Mutation {
    createUser(email: String, password: String, shortname: String): User
  }

  schema {
    query: Query
    mutation: Mutation
  }
`

// define graphql resolvers for schema above
const resolvers = {
  Query: {
    allQuestions: async () => QuestionModel.find({}),
    allSessions: async () => SessionModel.find({}),
    allTags: async () => TagModel.find({}),
    user: async (root, { id }) => UserModel.findById(id),
  },
}

// use graphql-tools to generate a usable schema for export
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
})
