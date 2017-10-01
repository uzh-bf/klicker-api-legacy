const {
  QuestionModel, QuestionInstanceModel, SessionModel, TagModel, UserModel,
} = require('../models')
const AuthService = require('../services/auth')

const setupTestEnv = async ({ email, password, shortname }) => {
  // find the id of the user to reset
  const user = await UserModel.findOne({ email })

  if (user) {
    await QuestionInstanceModel.remove({ user: user.id })
    await SessionModel.remove({ user: user.id })
    await QuestionModel.remove({ user: user.id })
    await TagModel.remove({ user: user.id })
    await UserModel.findByIdAndRemove(user.id)
  }

  // delete everything that belongs to the specified user (including the account)
  // const models = [QuestionInstanceModel, SessionModel, QuestionModel, TagModel]
  // const promises = models.map(model => model.remove({ user: user.id }))
  // const userPromise = UserModel.findOneAndRemove({ id: user.id })

  // await Promise.all([...promises, userPromise])

  return AuthService.signup(email, password, shortname)
}

module.exports = {
  setupTestEnv,
}
