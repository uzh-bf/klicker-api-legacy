const request = require('supertest')

const server = require('../app')

describe('tags', () => {
  it.skip('works', async () => {
    const response = await request(server).post('/graphql', {})
    expect(response).toMatchSnapshot()
  })
})
