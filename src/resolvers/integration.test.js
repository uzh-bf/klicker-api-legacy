const request = require('supertest')
const mongoose = require('mongoose')

const server = require('../app')
const { initializeDb } = require('../lib/test/setup')

process.env.NODE_ENV = 'test'

describe('integration', () => {
  let authCookie

  beforeAll(async () => {
    await initializeDb({ mongoose, email: 'testIntegration@bf.uzh.ch', shortname: 'integr' })
  })

  afterAll(async () => {
    await mongoose.disconnect()
    authCookie = null
  })

  describe('login', () => {
    it('works', async () => {
      // send a login request
      const response = await request(server)
        .post('/graphql')
        .send({
          query: `
            mutation LoginUser($email: String!, $password: String!) {
              login(email: $email, password: $password) {
                email
                shortname
              }
            }
          `,
          operationName: 'LoginUser',
          variables: {
            email: 'testIntegration@bf.uzh.ch',
            password: 'somePassword',
          },
        })

      // save the authorization cookie
      authCookie = response.header['set-cookie']

      expect(response.body.data).toMatchSnapshot()
      expect(authCookie.length).toEqual(1)
    })
  })
})
