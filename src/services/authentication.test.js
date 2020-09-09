require('dotenv').config()
const { ForbiddenError } = require('apollo-server-express')

const AuthenticationService = require('./authentication')
const { generateScopedToken } = require('./accounts')
const { Errors } = require('../constants')

describe('AuthenticationService', () => {
  const dummyUser = {
    id: 'asdf1234qwertz',
    role: 'User',
    shortname: 'test',
  }

  const deletionToken = generateScopedToken(dummyUser, 'delete')

  const activationToken = generateScopedToken(dummyUser, 'activate')

  describe('TokenVerification', () => {
    it('throws error when passed an invalid deletion token', () => {
      expect(AuthenticationService.verifyToken('invalidToken', 'delete', dummyUser.id)).toEqual(
        new ForbiddenError(Errors.INVALID_TOKEN)
      )
    })

    it('throws when users in deletion and auth token do not match', () => {
      expect(AuthenticationService.verifyToken(deletionToken, 'delete', 'someOtherUserId')).toEqual(
        new ForbiddenError(Errors.INVALID_TOKEN)
      )
    })

    it('throws when user and auth token match, but scope does not', () => {
      expect(AuthenticationService.verifyToken(deletionToken, 'activate', dummyUser.id)).toEqual(
        new ForbiddenError(Errors.INVALID_TOKEN)
      )
    })

    it('correctly verifies deletionToken', () => {
      expect(AuthenticationService.verifyToken(deletionToken, 'delete', dummyUser.id)).toBeTruthy()
    })

    it('correctly verifies activationToken', () => {
      expect(AuthenticationService.verifyToken(activationToken, 'activate', dummyUser.id)).toBeTruthy()
    })
  })
})
