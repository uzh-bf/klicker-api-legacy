const request = require('supertest')
const mongoose = require('mongoose')
const _pick = require('lodash/pick')

const server = require('../app')
const { initializeDb } = require('../lib/test/setup')
const { LoginMutation, CreateQuestionMutation } = require('./mutations')

process.env.NODE_ENV = 'test'

describe('Integration', () => {
  let authCookie

  beforeAll(async () => {
    await initializeDb({ mongoose, email: 'testIntegration@bf.uzh.ch', shortname: 'integr' })
  })

  afterAll(async () => {
    await mongoose.disconnect()
    authCookie = null
  })

  describe('Login', () => {
    it('works with valid credentials', async () => {
      // send a login request
      const response = await request(server)
        .post('/graphql')
        .send({
          query: LoginMutation,
          variables: {
            email: 'testIntegration@bf.uzh.ch',
            password: 'somePassword',
          },
        })

      // save the authorization cookie
      authCookie = response.header['set-cookie']

      // ensure that there were no errors with the graphql request
      expect(response.body.errors).toBeUndefined()

      expect(_pick(response.body.data.login, ['email', 'runningSession', 'shortname'])).toMatchSnapshot()
      expect(authCookie.length).toEqual(1)
    })
  })

  describe('Question Creation', () => {
    it.skip('works for SC questions', async () => {})
    it.skip('works for MC questions', async () => {})

    it('works for FREE questions', async () => {
      const response = await request(server)
        .post('/graphql')
        .set('Cookie', authCookie)
        .send({
          query: CreateQuestionMutation,
          variables: {
            title: 'Test FREE',
            description: 'This is a simple FREE question.',
            type: 'FREE',
            options: {},
            tags: ['TestTag'],
          },
        })

      // ensure that there were no errors with the graphql request
      expect(response.body.errors).toBeUndefined()
    })

    it('works for FREE_RANGE questions', async () => {
      const response = await request(server)
        .post('/graphql')
        .set('Cookie', authCookie)
        .send({
          query: CreateQuestionMutation,
          variables: {
            title: 'Test FREE_RANGE',
            description: 'This is a simple FREE_RANGE question.',
            type: 'FREE_RANGE',
            options: {
              restrictions: {
                min: 0,
                max: 10,
              },
            },
            tags: ['TestTag'],
          },
        })

      // ensure that there were no errors with the graphql request
      expect(response.body.errors).toBeUndefined()
    })
  })
})
