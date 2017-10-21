require('dotenv').config()

const mongoose = require('mongoose')

const SessionMgrService = require('./sessionMgr')
const SessionExecService = require('./sessionExec')
const { initializeDb, prepareSessionFactory } = require('../lib/test/setup')
const { sessionSerializer, questionInstanceSerializer } = require('../lib/test/serializers')

mongoose.Promise = Promise

// define how jest should serialize objects into snapshots
// we need to strip ids and dates as they are always changing
expect.addSnapshotSerializer(sessionSerializer)
expect.addSnapshotSerializer(questionInstanceSerializer)

const prepareSession = prepareSessionFactory(SessionMgrService)

describe('SessionExecService', () => {
  let user

  beforeAll(async () => {
    ({ user } = await initializeDb({
      mongoose,
      email: 'testSessionExec@bf.uzh.ch',
      shortname: 'sesExc',
      withLogin: true,
    }))
  })
  afterAll((done) => {
    mongoose.disconnect(done)
    user = undefined
  })

  describe('addFeedback', () => {
    let preparedSession

    beforeAll(async () => {
      preparedSession = await prepareSession(user.id)
    })

    it('prevents adding feedbacks if a session is not yet running', () => {
      expect(SessionExecService.addFeedback({
        sessionId: preparedSession.id,
        content: 'FAIL',
      })).rejects.toEqual(new Error('SESSION_NOT_STARTED'))
    })

    it('prevents adding feedbacks if the functionality is deactivated', async () => {
      await SessionMgrService.startSession({
        id: preparedSession.id,
        userId: user.id,
      })

      expect(SessionExecService.addFeedback({
        sessionId: preparedSession.id,
        content: 'FAIL',
      })).rejects.toEqual(new Error('SESSION_FEEDBACKS_DEACTIVATED'))
    })

    it('allows adding new feedbacks to a running session', async () => {
      await SessionMgrService.updateSettings({
        sessionId: preparedSession.id,
        userId: user.id,
        settings: {
          isFeedbackChannelActive: true,
        },
      })

      const session = await SessionExecService.addFeedback({
        sessionId: preparedSession.id,
        content: 'feedback1',
      })
      expect(session).toMatchSnapshot()

      const session2 = await SessionExecService.addFeedback({
        sessionId: preparedSession.id,
        content: 'feedback2',
      })
      expect(session2).toMatchSnapshot()
    })

    it('prevents adding feedbacks to an already finished session', async () => {
      await SessionMgrService.endSession({
        id: preparedSession.id,
        userId: user.id,
      })

      // TODO: add assertion
    })
  })

  describe('addConfusionTS', () => {
    let preparedSession

    beforeAll(async () => {
      preparedSession = await prepareSession(user.id)
    })

    it('prevents adding timesteps if a session is not yet running', () => {
      expect(SessionExecService.addConfusionTS({
        sessionId: preparedSession.id,
        difficulty: 9,
        speed: 15,
      })).rejects.toEqual(new Error('SESSION_NOT_STARTED'))
    })

    it('prevents adding timesteps if the functionality is deactivated', async () => {
      await SessionMgrService.startSession({
        id: preparedSession.id,
        userId: user.id,
      })

      expect(SessionExecService.addConfusionTS({
        sessionId: preparedSession.id,
        difficulty: 9,
        speed: 15,
      })).rejects.toEqual(new Error('SESSION_CONFUSION_DEACTIVATED'))
    })

    it('allows adding new timesteps', async () => {
      await SessionMgrService.updateSettings({
        sessionId: preparedSession.id,
        userId: user.id,
        settings: {
          isConfusionBarometerActive: true,
        },
      })

      const session = await SessionExecService.addConfusionTS({
        sessionId: preparedSession.id,
        difficulty: 20,
        speed: 10,
      })
      expect(session).toMatchSnapshot()

      const session2 = await SessionExecService.addConfusionTS({
        sessionId: preparedSession.id,
        difficulty: 40,
        speed: -10,
      })
      expect(session2).toMatchSnapshot()
    })

    it('prevents adding timesteps to an already finished session', async () => {
      await SessionMgrService.endSession({
        id: preparedSession.id,
        userId: user.id,
      })

      // TODO: add assertion
    })
  })

  describe('addResponse', () => {
    const response = {
      value: 'hello world',
    }
    let preparedSession

    beforeAll(async () => {
      preparedSession = await prepareSession(user.id)

      // start the session
      await SessionMgrService.startSession({ id: preparedSession.id, userId: user.id })
    })

    it('prevents adding a response to a closed question instance', () => {
      const promise = SessionExecService.addResponse({ instanceId: preparedSession.activeInstances[0], response })
      expect(promise).rejects.toEqual(new Error('INSTANCE_CLOSED'))
    })

    it('allows adding a response to an open question instance ', async () => {
      // activate the next block of the running session
      // this opens the instances for responses
      const session = await SessionMgrService.activateNextBlock({ userId: user.id })
      expect(session).toMatchSnapshot()

      // add a response
      const withResponse = await SessionExecService.addResponse({ instanceId: session.activeInstances[0], response })
      expect(withResponse).toMatchSnapshot()
    })

    afterAll(async () => {
      await SessionMgrService.endSession({
        id: preparedSession.id,
        userId: user.id,
      })
    })
  })
})
