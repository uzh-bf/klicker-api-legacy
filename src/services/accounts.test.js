require('dotenv').config()

const { UserInputError } = require('apollo-server-express')
const mongoose = require('mongoose')

const AccountService = require('./accounts')
const { initializeDb } = require('../lib/test/setup')

mongoose.Promise = require('bluebird')

describe('AccountService', () => {
  let userId

  beforeAll(async () => {
    await initializeDb({
      mongoose,
      email: 'existinguser@bf.uzh.ch',
      shortname: 'exusr',
      withLogin: true,
    })
    ;({ userId } = await initializeDb({
      mongoose,
      email: 'testaccounts3@bf.uzh.ch',
      shortname: 'accnts3',
      withLogin: true,
    }))
  })

  afterAll(async done => {
    mongoose.disconnect(done)
    userId = undefined
  })

  describe.only('checkAvailability', () => {
    it('throws on invalid email', async () => {
      expect(
        AccountService.checkAvailability({
          email: 'testblaa',
          shortname: 'testblee',
        })
      ).rejects.toThrow(new UserInputError('INVALID_INPUT'))
    })

    it('throws on invalid shortname', async () => {
      expect(
        AccountService.checkAvailability({
          email: 'testblaa@bf.uzh.ch',
          shortname: 'A',
        })
      ).rejects.toThrow(new UserInputError('INVALID_INPUT'))
    })

    it('returns a correct response for valid email', async () => {
      const result = await AccountService.checkAvailability({
        email: 'existinguser@bf.uzh.ch',
        shortname: undefined,
      })
      expect(result.email).toBeFalsy()
      expect(result.shortname).toBeUndefined()
    })

    it('returns a correct response for valid shortname', async () => {
      const result = await AccountService.checkAvailability({
        email: undefined,
        shortname: 'exusr',
      })
      expect(result.email).toBeUndefined()
      expect(result.shortname).toBeFalsy()
    })

    it('returns a correct response for valid email and shortname', async () => {
      const result = await AccountService.checkAvailability({
        email: 'nonexistent@bf.uzh.ch',
        shortname: 'nonexst',
      })
      expect(result.email).toBeTruthy()
      expect(result.shortname).toBeTruthy()
    })
  })

  describe('updateAccountData', () => {
    it('prevents changing the email address to an already existing one', async () => {
      expect(
        AccountService.updateAccountData({
          userId,
          email: 'existinguser@bf.uzh.ch',
        })
      ).rejects.toEqual(new UserInputError('EMAIL_NOT_AVAILABLE'))
    })

    it('prevents changing the shortname to an already existing one', async () => {
      expect(
        AccountService.updateAccountData({
          userId,
          shortname: 'exusr',
        })
      ).rejects.toEqual(new UserInputError('SHORTNAME_NOT_AVAILABLE'))
    })

    it('prevents changing the email address to an invalid value', async () => {
      expect(
        AccountService.updateAccountData({
          userId,
          email: 'invalidEmail@',
        })
      ).rejects.toEqual(new UserInputError('INVALID_INPUT'))
    })

    it('prevents changing the shortname to an invalid value', async () => {
      expect(
        AccountService.updateAccountData({
          userId,
          shortname: 'B',
        })
      ).rejects.toEqual(new UserInputError('INVALID_INPUT'))
    })

    it('allows changing user data with valid values', async () => {
      expect(
        AccountService.updateAccountData({
          userId,
          shortname: 'accnts4',
          institution: 'testing4',
          useCase: 'something4',
        })
      ).resolves.toMatchSnapshot()
    })
  })
})
