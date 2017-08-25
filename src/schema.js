const { makeExecutableSchema } = require('graphql-tools')

const { allQuestions, question, createQuestion } = require('./resolvers/questions')
const { allSessions, session } = require('./resolvers/sessions')
const { allTags, createTag } = require('./resolvers/tags')
const { createUser, login, user } = require('./resolvers/users')
const { allTypes } = require('./types')

// create graphql schema in schema language
const typeDefs = [
  `
  schema {
    query: Query
    mutation: Mutation
  }

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
    createQuestion(question: QuestionInput): Question
    createTag(tag: TagInput): Tag
    createUser(user: UserInput): User
    login(email: String, password: String): User
  }
`,
  ...allTypes,
]

// define graphql resolvers for schema above
const resolvers = {
  Query: {
    allQuestions,
    allSessions,
    allTags,
    question,
    session,
    user,
  },
  Mutation: {
    createQuestion,
    createTag,
    createUser,
    login,
  },
}

// use graphql-tools to generate a usable schema for export
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
})

/*
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
