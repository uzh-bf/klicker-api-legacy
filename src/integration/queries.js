const mapFeedbacks = ({ content, votes }) => `
  content: ${content}
  votes: ${votes}
`

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
const RunningSessionSerializer = {
  test: ({ runningSession }) => !!runningSession,
  print: ({
    runningSession: {
      confusionTS, feedbacks, blocks, settings,
    },
  }) => `
    runningSession {
      confusionTS: ${confusionTS}
      feedbacks: ${feedbacks.map(mapFeedbacks)}
      blocks: ${blocks.map(({ status, instances }) => `
        status: ${status}
        instances: ${instances.map(({ isOpen, question }) => `
          isOpen: ${isOpen}
          question {
            title: ${question.title}
            type: ${question.type}
          }
        `)}
      `)}
      settings: ${settings}
    }
  `,
}

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
          FREE_RANGE {
            restrictions {
              min
              max
            }
          }
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
const JoinSessionSerializer = {
  test: ({ joinSession }) => !!joinSession,
  print: ({ joinSession: { settings, activeQuestions, feedbacks } }) => `
    joinSession {
      settings: ${settings}
      activeQuestions: ${activeQuestions.map(({
    title, description, type, options,
  }) => `
        title: ${title}
        description: ${description}
        type: ${type}
        options: ${options}
      `)}
      feedbacks: ${feedbacks.map(mapFeedbacks)}
    }
  `,
}

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
                FREE_RANGE {
                  restrictions {
                    min
                    max
                  }
                }
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
              }
            }
          }
          results {
            ... on SCQuestionResults {
              CHOICES
            }
            ... on FREEQuestionResults {
              FREE {
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
const SessionEvaluationSerializer = {
  test: ({ session }) => !!session,
  print: ({ session: { status, blocks } }) => `
    evaluateSession {
      status: ${status}
      blocks: ${blocks.map(({ status: status2, instances }) => `
        status: ${status2}
        instances: ${instances.map(({
    isOpen, version, question, results, responses,
  }) => `
          isOpen: ${isOpen}
          version: ${version}
          question {
            title: ${question.title}
            type: ${question.type}
            versions: ${question.versions.map(({ description, options }) => `
              description: ${description}
              options: ${options}
            `)}
          }
          results: ${results}
          responses: ${responses.map(response => response.value)}
        `)}
      `)}
    }
  `,
}

module.exports = {
  TagListQuery,
  QuestionListQuery,
  SessionListQuery,
  RunningSessionQuery,
  AccountSummaryQuery,
  JoinSessionQuery,
  SessionEvaluationQuery,
  serializers: [RunningSessionSerializer, JoinSessionSerializer, SessionEvaluationSerializer],
}
