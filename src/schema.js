const { makeExecutableSchema } = require('graphql-tools')

const { requireAuth } = require('./services/auth')
const { allQuestions, createQuestion, question } = require('./resolvers/questions')
const {
  allSessions, createSession, endSession, session, startSession,
} = require('./resolvers/sessions')
const { allTags, createTag, tag } = require('./resolvers/tags')
const { createUser, login, user } = require('./resolvers/users')
const { allTypes } = require('./types')

// create graphql schema in schema language
// define only the root query and mutation here
// remaining types / input types go into types/
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

    createSession(session: SessionInput): Session
    startSession(id: ID): Session
    endSession(id: ID): Session

    createTag(tag: TagInput): Tag

    createUser(user: UserInput): User
    login(email: String, password: String): User
  }
`,
  ...allTypes,
]

// define graphql resolvers for schema above
// everything imported from their respective modules in resolvers/
const resolvers = {
  Query: {
    allQuestions: requireAuth(allQuestions),
    allSessions: requireAuth(allSessions),
    allTags: requireAuth(allTags),
    question: requireAuth(question),
    session: requireAuth(session),
    tag: requireAuth(tag),
    user: requireAuth(user),
  },
  Mutation: {
    createQuestion: requireAuth(createQuestion),
    createSession: requireAuth(createSession),
    createTag: requireAuth(createTag),
    createUser,
    endSession: requireAuth(endSession),
    login,
    startSession: requireAuth(startSession),
  },
  Question: {
    tags: (parentValue, args, context) => parentValue.tags.map(id => tag(parentValue, { id }, context)),
  },
  User: {
    questions: (parentValue, args, context) => parentValue.questions.map(id => question(parentValue, { id }, context)),
    sessions: (parentValue, args, context) => parentValue.sessions.map(id => session(parentValue, { id }, context)),
    tags: (parentValue, args, context) => parentValue.tags.map(id => tag(parentValue, { id }, context)),
  },
}

// use graphql-tools to generate a usable schema for export
module.exports = makeExecutableSchema({
  resolvers,
  typeDefs,
})
