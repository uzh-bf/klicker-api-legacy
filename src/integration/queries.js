const TagListQuery = `
  query TagList {
    tags: allTags {
      id
      name
    }
  }
`

const QuestionListQuery = `
  query QuestionList {
    questions: allQuestions {
      id
      title
      type
      instances {
        id
        createdAt
      }
      tags {
        id
        name
      }
      versions {
        id
        description
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`

const SessionListQuery = `
  query SessionList {
    sessions: allSessions {
      id
      name
      status
      blocks {
        id
        instances {
          id
          question {
            id
            title
            type
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

const RunningSessionQuery = `
  query RunningSession {
    runningSession {
      id
      runtime
      startedAt
      confusionTS {
        difficulty
        speed
        createdAt
      }
      feedbacks {
        id
        content
        votes
        createdAt
      }
      blocks {
        id
        status
        instances {
          id
          isOpen
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

const AccountSummaryQuery = `
  query AccountSummary {
    user {
      id
      shortname
      runningSession {
        id
      }
    }
  }
`

const JoinSessionQuery = `
  query JoinSession($shortname: String!) {
    joinSession(shortname: $shortname) {
      id
      settings {
        isFeedbackChannelActive
        isFeedbackChannelPublic
        isConfusionBarometerActive
      }
      activeQuestions {
        id
        instanceId
        title
        description
        type
        options {
          ... on FREEQuestionOptions {
            restrictions {
              min
              max
              type
            }
          }
          ... on SCQuestionOptions {
            choices {
              correct
              name
            }
          }
        }
      }
      feedbacks {
        id
        content
        votes
      }
    }
  }
`

const SessionEvaluationQuery = `
  query EvaluateSession($sessionId: ID!) {
    session(id: $sessionId) {
      id
      status
      blocks {
        id
        status
        instances {
          id
          isOpen
          version
          question {
            id
            title
            type
            versions {
              description
              options {
                ... on SCQuestionOptions {
                  choices {
                    correct
                    name
                  }
                }
                ... on FREEQuestionOptions {
                  restrictions {
                    min
                    max
                    type
                  }
                }
              }
            }
          }
          results {
            ... on SCQuestionResults {
              choices
            }
            ... on FREEQuestionResults {
              free {
                count
                key
                value
              }
            }
          }
          responses {
            id
            value
            createdAt
          }
        }
      }
    }
  }
`

module.exports = {
  TagListQuery,
  QuestionListQuery,
  SessionListQuery,
  RunningSessionQuery,
  AccountSummaryQuery,
  JoinSessionQuery,
  SessionEvaluationQuery,
}
