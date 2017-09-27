const mongoose = require('mongoose')
// const JWT = require('jsonwebtoken')

const SessionService = require('./sessions')

mongoose.Promise = Promise
process.env.APP_SECRET = 'hello-world'

describe('SessionService', () => {
  beforeAll(() => {
    mongoose.connect('mongodb://klicker:klicker@ds161042.mlab.com:61042/klicker-dev')
  })
  afterAll((done) => {
    mongoose.disconnect(done)
  })

  describe('createSession', () => {

  })
})
