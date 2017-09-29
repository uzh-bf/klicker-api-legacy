const AuthService = require('../services/auth')
const { UserModel } = require('../models')

/* ----- queries ----- */
const authUserQuery = (parentValue, args, { auth }) => UserModel.findById(auth.sub)
const userQuery = parentValue => UserModel.findById(parentValue.user)

/* ----- mutations ----- */
const createUserMutation = (parentValue, { user: { email, password, shortname } }) =>
  AuthService.signup(email, password, shortname)

const loginMutation = (parentValue, { email, password }, { res }) => AuthService.login(res, email, password)

module.exports = {
  createUser: createUserMutation,
  login: loginMutation,
  authUser: authUserQuery,
  user: userQuery,
}
