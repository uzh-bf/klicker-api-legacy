const RegistrationMutation = `
  mutation CreateUser($email: String!, $password: String!, $shortname: String!) {
    createUser(email: $email, password: $password, shortname: $shortname) {
      id
      email
      shortname
    }
  }
`

const LoginMutation = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
      shortname
      runningSession {
        id
      }
    }
  }
`

const CreateQuestionMutation = `
  mutation CreateQuestion(
    $title: String!
    $description: String!
    $options: QuestionOptionsInput!
    $type: Question_Type!
    $tags: [ID!]!
  ) {
    createQuestion(
      question: {
        title: $title
        description: $description
        options: $options
        type: $type
        tags: $tags
      }
    ) {
      id
      title
      type
      tags {
        id
        name
      }
      versions {
        id
        description
        options {
          SC {
            choices {
              correct
              name
            }
            randomized
          }
          MC {
            choices {
              correct
              name
            }
            randomized
          }
          FREE_RANGE {
            restrictions {
              min
              max
            }
          }
        }
        createdAt
      }
    }
  }
`

const CreateSessionMutation = `
  mutation CreateSession($name: String!, $blocks: [Session_QuestionBlockInput!]!) {
    createSession(session: { name: $name, blocks: $blocks }) {
      id
      confusionTS {
        difficulty
        speed
      }
      feedbacks {
        id
        content
        votes
      }
      blocks {
        id
        status
        instances {
          id
          question {
            id
            title
            type
          }
        }
      }
      settings {
        isConfusionBarometerActive
        isFeedbackChannelActive
        isFeedbackChannelPublic
      }
    }
  }
`

const StartSessionMutation = `
  mutation StartSession($id: ID!) {
    startSession(id: $id) {
      id
      status
    }
  }
`

const EndSessionMutation = `
  mutation EndSession($id: ID!) {
    endSession(id: $id) {
      id
      status
    }
  }
`

const AddFeedbackMutation = `
  mutation AddFeedback($sessionId: ID!, $content: String!) {
    addFeedback(sessionId: $sessionId, content: $content) {
      id
      feedbacks {
        id
        content
        votes
      }
    }
  }
`

const DeleteFeedbackMutation = `
  mutation DeleteFeedback($sessionId: ID!, $feedbackId: ID!) {
    deleteFeedback(sessionId: $sessionId, feedbackId: $feedbackId) {
      id
      feedbacks {
        id
        content
        votes
      }
    }
  }
`

const AddConfusionTSMutation = `
  mutation AddConfusionTS($sessionId: ID!, $difficulty: Int!, $speed: Int!) {
    addConfusionTS(sessionId: $sessionId, difficulty: $difficulty, speed: $speed) {
      id
      confusionTS {
        difficulty
        speed
        createdAt
      }
    }
  }
`

const UpdateSessionSettingsMutation = `
  mutation UpdateSessionSettings($sessionId: ID!, $settings: Session_SettingsInput!) {
    updateSessionSettings(sessionId: $sessionId, settings: $settings) {
      id
      settings {
        isConfusionBarometerActive
        isFeedbackChannelActive
        isFeedbackChannelPublic
      }
    }
  }
`

const AddResponseMutation = `
  mutation AddResponse($instanceId: ID!, $response: QuestionInstance_ResponseInput!) {
    addResponse(instanceId: $instanceId, response: $response) {
      id
    }
  }
`

const ActivateNextBlockMutation = `
  mutation ActivateNextBlock {
    activateNextBlock {
      id
      blocks {
        id
        status
        instances {
          id
          isOpen
        }
      }
    }
  }
`

module.exports = {
  RegistrationMutation,
  LoginMutation,
  CreateQuestionMutation,
  CreateSessionMutation,
  StartSessionMutation,
  EndSessionMutation,
  AddFeedbackMutation,
  DeleteFeedbackMutation,
  AddConfusionTSMutation,
  UpdateSessionSettingsMutation,
  AddResponseMutation,
  ActivateNextBlockMutation,
}
