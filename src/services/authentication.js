const JWT = require('jsonwebtoken')
const { AuthenticationError, ForbiddenError } = require('apollo-server-express')
const { rule, shield, allow } = require('graphql-shield')
const CFG = require('../klicker.conf.js')
const { Errors } = require('../constants')

const APP_CFG = CFG.get('app')

const verifyToken = (token, wantedScope, userId) => {
  // validate the token
  try {
    JWT.verify(token, APP_CFG.secret)
  } catch (e) {
    return new ForbiddenError(Errors.INVALID_TOKEN)
  }

  // decode the valid token
  const { sub, scope } = JWT.decode(token)

  // ensure that the wanted scope is available
  if ((wantedScope && !scope.includes(wantedScope)) || (userId && sub !== userId)) {
    return new ForbiddenError(Errors.INVALID_TOKEN)
  }

  return true
}

// checks whether user is logged in
const isAuthenticated = rule({ cache: 'contextual' })(async (parentValue, args, context) => {
  if (context.auth && context.auth.sub) {
    return true
  }
  return new AuthenticationError(Errors.UNAUTHORIZED)
})

// checks whether provided token allows a given action
const isInScope = (tokenType, wantedScope) => {
  rule(`name-${(wantedScope, tokenType)}`, { cache: 'strict' })(async (parentValue, args) => {
    return verifyToken(args.tokenType, wantedScope)
  })
}

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
    checkAccountStatus: allow,
    checkAvailability: allow,
    joinSession: allow,
    question: isAuthenticated,
    runningSession: isAuthenticated,
    session: isAuthenticated,
    user: isAuthenticated,
  },

  Mutation: {
    activateAccount: isInScope('activationToken', 'activate'),
    archiveQuestions: isAuthenticated,
    addFeedback: allow,
    deleteFeedback: isAuthenticated,
    addConfusionTS: allow,
    addResponse: allow,
    changePassword: isAuthenticated,
    createQuestion: isAuthenticated,
    createSession: isAuthenticated,
    createUser: allow,
    deleteQuestions: isAuthenticated,
    deleteResponse: isAuthenticated,
    deleteSessions: isAuthenticated,
    endSession: isAuthenticated,
    login: allow,
    loginParticipant: allow,
    logout: allow,
    modifyQuestion: isAuthenticated,
    modifySession: isAuthenticated,
    modifyUser: isAuthenticated,
    pauseSession: isAuthenticated,
    cancelSession: isAuthenticated,
    requestAccountDeletion: isAuthenticated,
    resolveAccountDeletion: isAuthenticated,
    requestPassword: allow,
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
    // TODO What is the criteria? Being logged in?
    confusionAdded: allow,
    feedbackAdded: allow,
    sessionUpdated: allow,
    runningSessionUpdated: allow,
  },
})

module.exports = {
  permissions,
}
