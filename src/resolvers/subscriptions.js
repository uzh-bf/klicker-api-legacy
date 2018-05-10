const { PubSub } = require('graphql-subscriptions')

const pubsub = new PubSub()

/* ----- subscriptions ----- */
const feedbackAddedSubscription = {
  // resolve: {},
  subscribe: () => pubsub.asyncIterator('feedbackAdded'),
}

module.exports = {
  // export the pubsub interface
  pubsub,

  // export subscriptions
  feedbackAdded: feedbackAddedSubscription,
}
