const request = require('supertest')

const server = require('../app')

describe('users', () => {
  it('works', async () => {
    const response = await request(server).post('/graphql', {})
    expect(response).toMatchSnapshot()
  })
})
