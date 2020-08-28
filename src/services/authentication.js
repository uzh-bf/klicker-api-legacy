const { rule, shield } = require('graphql-shield')

// checks whether user is logged in
const isAuthenticated = rule({ cache: 'contextual' })(async (parentValue, args, context) => {
  if (context.auth && context.auth.sub) {
    return true
  }
  return false
})

/*  // Checks whether user is an admin
const isAdmin = rule({ cache: 'contextual' })(
  async (parentValue, args, context) => {
    return context.auth.scope.includes('admin')
  }
)
*/

const permissions = shield({
  // List all requests which require authentication
  Query: {
    allQuestions: isAuthenticated,
    allSessions: isAuthenticated,
    allTags: isAuthenticated,
    question: isAuthenticated,
    runningSession: isAuthenticated,
    session: isAuthenticated,
    user: isAuthenticated,
  },

  Mutation: {
    archiveQuestions: isAuthenticated,
    deleteFeedback: isAuthenticated,
    changePassword: isAuthenticated,
    createQuestion: isAuthenticated,
    createSession: isAuthenticated,
    deleteQuestions: isAuthenticated,
    deleteResponse: isAuthenticated,
    deleteSessions: isAuthenticated,
    endSession: isAuthenticated,
    modifyQuestion: isAuthenticated,
    modifySession: isAuthenticated,
    modifyUser: isAuthenticated,
    pauseSession: isAuthenticated,
    cancelSession: isAuthenticated,
    requestAccountDeletion: isAuthenticated,
    resolveAccountDeletion: isAuthenticated,
    requestPresignedURL: isAuthenticated,
    startSession: isAuthenticated,
    updateSessionSettings: isAuthenticated,
    activateNextBlock: isAuthenticated,
    activateBlockById: isAuthenticated,
    resetQuestionBlock: isAuthenticated,
    modifyQuestionBlock: isAuthenticated,
    questionStatistics: isAuthenticated,
    exportQuestions: isAuthenticated,
  },

  Subscription: {
    // TODO
  },

  File: undefined,
  Question: undefined,
  QuestionStatistics: undefined,
  QuestionInstance: undefined,
  SCQuestionOptions: undefined,
  SCQuestionResults: undefined,
  FREEQuestionOptions: undefined,
  FREEQuestionResults: undefined,
  Session: undefined,
  Tag: undefined,
  User: undefined,
})

module.exports = {
  permissions,
}
