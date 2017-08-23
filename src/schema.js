// @flow

const { makeExecutableSchema } = require('graphql-tools')

const { QuestionModel, SessionModel, TagModel, UserModel } = require('./models')
const { allTypes } = require('./types')

// create graphql schema in schema language
const typeDefs = [`
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
`, ...allTypes]

// define graphql resolvers for schema above
const resolvers = {
  Query: {
    allQuestions: () => QuestionModel.find({}),
    allSessions: () => SessionModel.find({}),
    allTags: () => TagModel.find({}),
    user: (root, { id }) => UserModel.findById(id),
  },
}

// use graphql-tools to generate a usable schema for export
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
})
