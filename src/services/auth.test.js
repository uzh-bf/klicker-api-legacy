const JWT = require('jsonwebtoken')

const { isAuthenticated, isValidJWT, signup, login } = require('./auth')

describe('isAuthenticated', () => {
  it('correctly validates authentication state', () => {
    const auth1 = null
    const auth2 = {}
    const auth3 = { sub: null }
    const auth4 = { sub: 'abcd' }

    expect(() => isAuthenticated(auth1)).toThrow('INVALID_TOKEN')
    expect(() => isAuthenticated(auth2)).toThrow('INVALID_TOKEN')
    expect(() => isAuthenticated(auth3)).toThrow('INVALID_TOKEN')
    expect(isAuthenticated(auth4)).toBeUndefined()
  })
})

describe('isValidJWT', () => {
  it('correctly validates JWTs', () => {
    const jwt1 = null
    const jwt2 = 'abcd'
    const jwt3 = JWT.sign({ id: 'abcd' }, 'hello-world')

    expect(isValidJWT(jwt1, 'hello-world')).toBeFalsy()
    expect(isValidJWT(jwt2, 'hello-world')).toBeFalsy()
    expect(isValidJWT(jwt3, 'hello-world')).toBeTruthy()
  })
})

describe('signup', () => {
  it('works')
})

describe('login', () => {
  it('works')
})
