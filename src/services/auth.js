const JWT = require('jsonwebtoken')

const UserModel = require('../models/User')

const isAuthenticated = (auth) => {
  if (!auth || !auth.sub) {
    throw new Error('INVALID_TOKEN')
  }
}

const isValidJWT = (jwt, secret) => {
  try {
    JWT.verify(jwt, secret)
    return true
  } catch (err) {
    return false
  }
}

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

    // generate a JWT for future authentication
    // TODO: extend the JWT contents with necessary properties
    const jwt = JWT.sign({ sub: user.id, scope: ['user'] }, process.env.JWT_SECRET)

    // set a cookie with the generated JWT
    // TODO: set a reasonable maxAge
    // TODO: set other important cookie settings (path etc.)
    res.cookie('jwt', jwt, { httpOnly: true, maxAge: 900000, path: '/graphql' })

    // resolve with data about the user
    resolve(user)
  })
}

module.exports = {
  isAuthenticated,
  isValidJWT,
  signup,
  login,
}
