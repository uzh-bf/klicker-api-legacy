// @flow

const { makeExecutableSchema } = require('graphql-tools')

const { QuestionModel, SessionModel, TagModel, UserModel } = require('./models')
const { allTypes } = require('./types')

// check if auth property is available
// throw if not properly authenticated
const isAuthenticated = (context) => {
  if (!context.auth || !context.auth.sub) {
    throw new Error('INVALID_TOKEN')
  }
}

// create graphql schema in schema language
const typeDefs = [
  `
  type Query {
    allQuestions(userId: ID): [Question]
    allSessions(userId: ID): [Session]
    allTags(userId: ID): [Tag]
    user: User
  }

  type Mutation {
    createTag(name: String): Tag
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
    allQuestions: async (parentValue, args, context) => {
      isAuthenticated(context)

      const user = await UserModel.findById(context.auth.sub).populate(['questions'])
      return user.questions
    },
    allSessions: async (parentValue, args, context) => {
      isAuthenticated(context)

      const user = await UserModel.findById(context.auth.sub).populate(['sessions'])
      return user.sessions
    },
    allTags: async (parentValue, args, context) => {
      isAuthenticated(context)

      const user = await UserModel.findById(context.auth.sub).populate(['tags'])
      return user.tags
    },
    user: async (parentValue, args, context) => {
      isAuthenticated(context)

      return UserModel.findById(context.auth.sub).populate(['questions', 'sessions', 'tags'])
    },
  },
  Mutation: {
    createTag: async (parentValue, { name }, context) => {
      isAuthenticated(context)

      const newTag = await new TagModel({
        name,
      }).save()

      const user = await UserModel.findById(context.auth.sub)

      await user.update({
        $set: { tags: [...user.tags, newTag.id] },
        $currentDate: { updatedAt: true },
      })

      return newTag
    },
    createUser: async (parentValue, { email, password, shortname }) => {
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
    "shortname": "hehehe"
  }

  mutation {
    createTag(userId:"5995eb5f778d9eef0594ad9f", name:"Blablas") {
      id
    }
  }

*/
