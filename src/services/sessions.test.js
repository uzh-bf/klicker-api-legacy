const mongoose = require('mongoose')
// const JWT = require('jsonwebtoken')

const AuthService = require('./auth')
const SessionService = require('./sessions')

mongoose.Promise = Promise
process.env.APP_SECRET = 'hello-world'

expect.addSnapshotSerializer({
  test: val => val.id && val.blocks && val.name && val.status >= 0 && val.settings && val.user,
  print: val => `
    Name: ${val.name}
    Status: ${val.status}
    User: ${val.user}

    Blocks:
      ${val.blocks}

    Settings:
      ${val.settings}
  `,
})

describe('SessionService', () => {
  let user

  beforeAll(async () => {
    // connect to the database
    await mongoose.connect('mongodb://klicker:klicker@ds161042.mlab.com:61042/klicker-dev')
    // login as a test user
    user = await AuthService.login(null, 'roland.schlaefli@bf.uzh.ch', 'abcdabcd')
  })
  afterAll((done) => {
    mongoose.disconnect(done)
    user = undefined
  })

  describe('createSession', () => {
    it('prevents creating sessions without question blocks', async () => {
      expect(SessionService.createSession({
        name: 'empty session',
        questionBlocks: [],
        user: user.id,
      })).rejects.toEqual(new Error('EMPTY_SESSION'))
    })

    it('skips over question blocks without questions', async () => {
      const newSession = await SessionService.createSession({
        name: 'session with an empty block',
        questionBlocks: [
          {
            questions: [{ id: '59b13d288b01b731583850ab' }, { id: '59b13d6f8b01b731583850af' }],
          },
          {
            questions: [],
          },
          {
            questions: [{ id: '59b1481857f3c34af09a4736' }],
          },
        ],
        user: user.id,
      })

      expect(newSession.blocks.length).toEqual(2)
    })

    it('allows creating a valid session', async () => {
      const newSession = await SessionService.createSession({
        name: 'hello world',
        questionBlocks: [
          {
            questions: [{ id: '59b13d288b01b731583850ab' }, { id: '59b13d6f8b01b731583850af' }],
          },
          {
            questions: [{ id: '59b1481857f3c34af09a4736' }],
          },
        ],
        user: user.id,
      })

      expect(newSession).toMatchSnapshot()
    })
  })
})
