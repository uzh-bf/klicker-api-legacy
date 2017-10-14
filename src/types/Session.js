/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [Session, QuestionInstance]

const QuestionInstance = require('./QuestionInstance')

const Session = `
  enum Session_Status {
    CREATED
    RUNNING
    COMPLETED
  }

  input SessionInput {
    name: String!
    blocks: [Session_QuestionBlockInput]!
  }
  type Session {
    id: ID!
    name: String!

    status: Session_Status!
    settings: Session_Settings!
    user: User!

    blocks: [Session_QuestionBlock!]!
    confusionTS: [Session_ConfusionTimestep!]!
    feedbacks: [Session_Feedback!]!

    createdAt: String!
    updatedAt: String!
  }

  input Session_SettingsInput {
    isConfusionBarometerActive: Boolean
    isFeedbackChannelActive: Boolean
    isFeedbackChannelPublic: Boolean
  }
  type Session_Settings {
    isConfusionBarometerActive: Boolean!
    isFeedbackChannelActive: Boolean!
    isFeedbackChannelPublic: Boolean!
  }

  input Session_QuestionBlockInput {
    questions: [ID!]!
  }
  type Session_QuestionBlock {
    id: ID!
    status: Int!

    instances: [QuestionInstance!]!
  }

  type Session_ConfusionTimestep {
    id: ID!
    difficulty: Int!
    speed: Int!

    createdAt: String!
  }

  type Session_Feedback {
    id: ID!
    content: String!
    votes: Int!

    createdAt: String!
  }
`
