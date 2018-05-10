const { PubSub, withFilter } = require('graphql-subscriptions')

// instantiate a new pubsub instance
// TODO: replace with redis pubsub
const pubsub = new PubSub()

// filter out feedbacks for the requested session
const compareSessionId = (payload, variables) => payload.sessionId === variables.sessionId

/* ----- subscriptions ----- */
const FEEDBACK_ADDED = 'feedbackAdded'
const feedbackAddedSubscription = {
  // resolve: {},
  subscribe: withFilter(() => pubsub.asyncIterator(FEEDBACK_ADDED), compareSessionId),
}

const CONFUSION_ADDED = 'confusionAdded'
const confusionAddedSubscription = {
  subscribe: withFilter(() => pubsub.asyncIterator(CONFUSION_ADDED), compareSessionId),
}

module.exports = {
  // export the pubsub interface
  pubsub,

  // export subscriptions
  confusionAdded: confusionAddedSubscription,
  feedbackAdded: feedbackAddedSubscription,

  // export subscription types
  CONFUSION_ADDED,
  FEEDBACK_ADDED,
}
