/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [Session, Feedback]

const Feedback = require('./Feedback')

const Session = `
  enum SessionStatus {
    CREATED,
    RUNNING,
    COMPLETED
  }

  type SessionSettings {
    isConfusionBarometerActive: Boolean
    isFeedbackChannelActive: Boolean
    isFeedbackChannelPublic: Boolean
  }

  type Session {
    id: ID!

    name: String!
    status: SessionStatus!
    settings: SessionSettings

    feedbacks: [Feedback]

    createdAt: String
    updatedAt: String
  }
`
