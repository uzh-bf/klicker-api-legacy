export const QuestionTypes = {
  SC: 'SC',
  MC: 'MC',
  FREE: 'FREE',
  FREE_RANGE: 'FREE_RANGE',
}

export const QuestionGroups = {
  CHOICES: [QuestionTypes.SC, QuestionTypes.MC],
  FREE: [QuestionTypes.FREE, QuestionTypes.FREE_RANGE],
}

export const QuestionBlockStatus = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  EXECUTED: 'EXECUTED',
}

export const SessionStatus = {
  CREATED: 'CREATED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
}
