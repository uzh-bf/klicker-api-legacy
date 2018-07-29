const crypto = require('crypto')

const AuthService = require('../services/auth')
const { UserModel } = require('../models')

/* ----- queries ----- */
const authUserByIDQuery = (parentValue, args, { auth }) => UserModel.findById(auth.sub)
const userByIDQuery = parentValue => UserModel.findById(parentValue.user)

// Generate an HMAC for user identity verification
const hmacQuery = (parentValue, args, { auth }) => crypto
  .createHmac('sha256', process.env.APP_SECRET)
  .update(auth.sub)
  .digest('hex')

/* ----- mutations ----- */
const createUserMutation = (
  parentValue,
  {
    email, password, shortname, institution, useCase,
  },
) => AuthService.signup(email, password, shortname, institution, useCase)

const loginMutation = (parentValue, { email, password }, { res }) => AuthService.login(res, email, password)

const logoutMutation = (parentValue, args, { res }) => AuthService.logout(res)

const changePasswordMutation = (parentValue, { newPassword }, { auth }) => AuthService.changePassword(auth.sub, newPassword)

const requestPasswordMutation = (parentValue, { email }, { res }) => AuthService.requestPassword(res, email)

module.exports = {
  // queries
  authUser: authUserByIDQuery,
  user: userByIDQuery,
  hmac: hmacQuery,

  // mutations
  changePassword: changePasswordMutation,
  createUser: createUserMutation,
  login: loginMutation,
  logout: logoutMutation,
  requestPassword: requestPasswordMutation,
}
