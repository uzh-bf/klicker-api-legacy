// @flow

const { makeExecutableSchema } = require('graphql-tools')

const { QuestionModel, SessionModel, TagModel, UserModel } = require('./models')
const { allTypes } = require('./types')

// create graphql schema in schema language
const typeDefs = [
  `
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
`,
  ...allTypes,
]

// define graphql resolvers for schema above
const resolvers = {
  Query: {
    allQuestions: async () => QuestionModel.find({}),
    allSessions: async () => SessionModel.find({}),
    allTags: async () => TagModel.find({}),
    user: async (root, { id }) => UserModel.findById(id),
  },
  Mutation: {
    createUser: async (root, { email, password, shortname }, context, info) => {
      const newUser = new UserModel({
        email,
        password,
        shortname,
        isAAI: false,
      })

      return newUser.save()
    },
  },
}

// use graphql-tools to generate a usable schema for export
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
})

/*

mutation Signup($email: String!, $password: String!, $shortname:String!) {
  createUser(email: $email, password: $password, shortname :$shortname) {
    id
    email
    shortname
    isActive
    isAAI
  }
}

{
  "email": "Helsloworld",
  "password": "abc",
  "shortname": "hehehe",
}

*/
