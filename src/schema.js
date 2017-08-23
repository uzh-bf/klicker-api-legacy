// @flow

const { makeExecutableSchema } = require('graphql-tools')

const { QuestionModel, SessionModel, TagModel, UserModel } = require('./models')
const { allTypes } = require('./types')

// create graphql schema in schema language
const typeDefs = [
  `
  type Query {
    allQuestions(userId: ID): [Question]
    allSessions(userId: ID): [Session]
    allTags(userId: ID): [Tag]
    user(id: ID): User
  }

  type Mutation {
    createTag(userId: ID, name: String): Tag
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
    allQuestions: async (root, { userId }) => {
      const user = await UserModel.findById(userId).populate(['questions'])
      return user.questions
    },
    allSessions: async (root, { userId }) => {
      const user = await UserModel.findById(userId).populate(['sessions'])
      return user.sessions
    },
    allTags: async (root, { userId }) => {
      const user = await UserModel.findById(userId).populate(['tags'])
      return user.tags
    },
    user: async (root, { id }) => UserModel.findById(id).populate(['questions', 'sessions', 'tags']),
  },
  Mutation: {
    createTag: async (root, { name, userId }, context, info) => {
      const newTag = await new TagModel({
        name,
      }).save()

      const user = await UserModel.findById(userId)
      const updatedUser = await user.update({
        $set: { tags: [...user.tags, newTag.id] },
        $currentDate: { updatedAt: true },
      })

      console.dir(updatedUser)

      return newTag
    },
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
  {
    user(id:"5995eb5f778d9eef0594ad9f") {
      id
      email
      questions {
        id
      }
      sessions {
        id
      }
      tags {
        id
        name
      }
    }
  }

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

  mutation {
    createTag(userId:"5995eb5f778d9eef0594ad9f", name:"Blablas") {
      id
    }
  }

*/
