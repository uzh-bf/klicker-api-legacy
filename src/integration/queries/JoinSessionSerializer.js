const { draftContentSerializer } = require('../../lib/test/serializers')

module.exports = {
  test: ({ joinSession }) => !!joinSession,
  print: ({ joinSession: { settings, activeQuestions, feedbacks } }) => `
    joinSession {
      settings: ${JSON.stringify(settings)}
      activeQuestions: ${activeQuestions.map(
    ({
      title, content, description, type, options,
    }) => `
        title: ${title}
        content: ${draftContentSerializer(content)}
        description: ${description}
        type: ${type}
        options: ${JSON.stringify(options)}
      `,
  )}
      feedbacks: ${feedbacks.map(
    ({ content, votes }) => `
        content: ${content}
        votes: ${votes}
      `,
  )}
    }
  `,
}
