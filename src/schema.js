// @flow

const Permissions = require('express-jwt-permissions')
const { makeExecutableSchema } = require('graphql-tools')

const AuthService = require('./services/auth')
const { QuestionModel, TagModel, UserModel } = require('./models')
const { allTypes } = require('./types')

// create graphql schema in schema language
const typeDefs = [
  `
  type Query {
    allQuestions: [Question]
    allSessions: [Session]
    allTags: [Tag]
    question(id: ID): Question
    session(id: ID): Session
    tag(id: ID): Tag
    user: User
  }

  type Mutation {
    createQuestion(title: String, type: String, tags: [ID]): Question
    createTag(name: String): Tag
    createUser(email: String, password: String, shortname: String): User
    login(email: String, password: String): User
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
    allQuestions: async (parentValue, args, { auth }) => {
      AuthService.isAuthenticated(auth)

      const user = await UserModel.findById(auth.sub).populate(['questions'])
      return user.questions
    },
    allSessions: async (parentValue, args, { auth }) => {
      AuthService.isAuthenticated(auth)

      const user = await UserModel.findById(auth.sub).populate(['sessions'])
      return user.sessions
    },
    allTags: async (parentValue, args, { auth }) => {
      AuthService.isAuthenticated(auth)

      const user = await UserModel.findById(auth.sub).populate(['tags'])
      return user.tags
    },
    question: async (parentValue, { id }, { auth }) => {
      AuthService.isAuthenticated(auth)

      return QuestionModel.findOne({ id, user: auth.sub })
    },
    user: async (parentValue, args, { auth }) => {
      AuthService.isAuthenticated(auth)

      return UserModel.findById(auth.sub).populate(['questions', 'sessions', 'tags'])
    },
  },
  Mutation: {
    createQuestion: async (parentValue, { tags, title, type }, { auth }) => {
      AuthService.isAuthenticated(auth)

      // TODO: if non-existent tags are passed, they need to be created
      const fetchTags = await TagModel.find({ _id: { $in: tags } })

      const newQuestion = await new QuestionModel({
        tags: fetchTags,
        title,
        type,
      }).save()

      const user = await UserModel.findById(auth.sub).populate(['questions'])
      user.questions.push(newQuestion.id)

      await user.update({
        $set: { questions: [...user.questions, newQuestion.id] },
        $currentDate: { updatedAt: true },
      })

      return newQuestion
    },
    createTag: async (parentValue, { name }, { auth }) => {
      AuthService.isAuthenticated(auth)

      const newTag = await new TagModel({
        name,
      }).save()

      const user = await UserModel.findById(auth.sub)

      await user.update({
        $set: { tags: [...user.tags, newTag.id] },
        $currentDate: { updatedAt: true },
      })

      return newTag
    },
    createUser: async (parentValue, { email, password, shortname }) => {
      return AuthService.signup(email, password, shortname)
    },
    login: async (parentValue, { email, password }) => {
      return AuthService.login(email, password)
    },
  },
}

// use graphql-tools to generate a usable schema for export
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
})

/*
  JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1OTk1ZWI2Yjc3OGQ5ZWVmMDU5NGFkYTAiLCJwZXJtaXNzaW9ucyI6WyJ1c2VyIiwiYWRtaW4iXX0.6E7SzoVXFstKJ7WUEHZ1NBxQZgmK-bOAKZXEH6n8tao

  mutation {
    login(email:"aw@ibf.ch", password:"abcd") {
      id
    }
  }

  {
  user {
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
  createTag(name:"Blablas") {
    id
  }
}

mutation {
  createQuestion(title:"blalblaas", type:"SC", tags: ["599d9b227e22d14055cc23f5"]) {
    id
    title
    type
    tags {
      id
    }

    createdAt
    updatedAt
  }
}

*/
