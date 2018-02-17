const AuthService = require('../services/auth')
const { UserModel } = require('../models')

/* ----- queries ----- */
const authUserByIDQuery = (parentValue, args, { auth }) => UserModel.findById(auth.sub)
const userByIDQuery = parentValue => UserModel.findById(parentValue.user)

/* ----- mutations ----- */
const createUserMutation = (parentValue, { email, password, shortname }) =>
  AuthService.signup(email, password, shortname)

const loginMutation = (parentValue, { email, password }, { res }) => AuthService.login(res, email, password)

const changePasswordMutation = (parentValue, { newPassword }, { res, auth }) =>
  AuthService.changePassword(res, auth.sub, newPassword)

module.exports = {
  // queries
  authUser: authUserByIDQuery,
  user: userByIDQuery,

  // mutations
  changePassword: changePasswordMutation,
  createUser: createUserMutation,
  login: loginMutation,
}
