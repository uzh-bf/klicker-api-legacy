// @flow

const UserModel = require('../models/User')

const isAuthenticated = (auth) => {
  if (auth && !auth.sub) {
    return
  }

  throw new Error('INVALID_TOKEN')
}

/* const isAuthenticated = (auth, callback) => {
  return new Promise((resolve, reject) => {
    if (auth && !auth.sub) {
      resolve(callback())
    }

    reject('INVALID_TOKEN')
  })
} */

const signup = async (email, password, shortname) => {
  // create a new user based on the passed data
  const newUser = await new UserModel({
    email,
    password,
    shortname,
    isAAI: false,
  }).save()

  // return a promise with the newly created user
  return new Promise((resolve, reject) => {
    if (newUser) {
      resolve(newUser)
    }

    reject(new Error(''))
  })
}

const login = async (res, email, password) => {
  // TODO: salt, hash, etc.
  const preparedPassword = password

  // look for a single user with the given email/password combination
  const user = await UserModel.findOne({ email, password: preparedPassword })

  return new Promise((resolve, reject) => {
    if (!user) {
      reject('INVALID_LOGIN')
    }

    res.cookie('someCookie', 'asdasd', { maxAge: 900000, httpOnly: true })
    resolve(user)
  })
}

module.exports = {
  isAuthenticated,
  signup,
  login,
}
