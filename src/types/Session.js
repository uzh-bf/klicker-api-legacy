/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [Session, Feedback, QuestionInstance]

const Feedback = require('./Feedback')
const QuestionInstance = require('./QuestionInstance')

const Session = `
  enum SessionStatus {
    CREATED,
    RUNNING,
    COMPLETED
  }

  input Session_QuestionInput {
    id: ID!
  }

  input QuestionBlockInput {
    questions: [Session_QuestionInput]
  }

  input SessionInput {
    name: String!
    blocks: [QuestionBlockInput]!
  }

  type SessionSettings {
    isConfusionBarometerActive: Boolean
    isFeedbackChannelActive: Boolean
    isFeedbackChannelPublic: Boolean
  }

  type QuestionBlock {
    questions: [QuestionInstance]
  }

  type Session {
    id: ID!

    name: String!
    status: Int!
    settings: SessionSettings

    blocks: [QuestionBlock]
    feedbacks: [Feedback]

    createdAt: String
    updatedAt: String
  }
`
