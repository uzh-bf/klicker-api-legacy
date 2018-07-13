module.exports = {
  test: ({ createSession }) => !!createSession,
  print: ({
    createSession: {
      confusionTS, feedbacks, blocks, settings,
    },
  }) => `
    createSession {
      confusionTS: ${confusionTS}
      feedbacks: ${feedbacks}
      blocks: ${blocks.map(
    ({ status, instances }) => `
        status: ${status}
        instances: ${instances.map(
    ({ question }) => `
          title: ${question.title}
          type: ${question.type}
        `,
  )}
      `,
  )}
      settings: ${JSON.stringify(settings)}
    }
  `,
}
