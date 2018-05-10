const { PubSub, withFilter } = require('graphql-subscriptions')

const pubsub = new PubSub()

/* ----- subscriptions ----- */
const feedbackAddedSubscription = {
  // resolve: {},
  subscribe: () =>
    withFilter(
      () => pubsub.asyncIterator('feedbackAdded'),
      // filter out feedbacks for the requested session
      (payload, variables) => payload.sessionId === variables.sessionId,
    ),
}

module.exports = {
  // export the pubsub interface
  pubsub,

  // export subscriptions
  feedbackAdded: feedbackAddedSubscription,
}
