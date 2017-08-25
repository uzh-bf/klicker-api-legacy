const bcrypt = require('bcryptjs')
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
  // TODO: validation etc.

  // generate a salt with bcyrpt using 10 rounds
  // hash and salt the password
  const hash = bcrypt.hashSync(password, 10)

  // create a new user based on the passed data
  const newUser = await new UserModel({
    email,
    password: hash,
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
  // look for a single user with the given email
  const user = await UserModel.findOne({ email })

  return new Promise((resolve, reject) => {
    // check whether the user exists and hashed passwords match
    if (!user || !bcrypt.compareSync(password, user.password)) {
      reject('INVALID_LOGIN')
    }

    // generate a JWT for future authentication
    // expiresIn: one day equals 86400 seconds
    // TODO: add more necessary properties for the JWT
    const jwt = JWT.sign({ expiresIn: 86400, sub: user.id, scope: ['user'] }, process.env.JWT_SECRET)

    // set a cookie with the generated JWT
    // maxAge: one day equals 86400000 milliseconds
    // path: cookie should only be valid for the graphql API
    // httpOnly: don't allow interactions from javascript
    // TODO: set other important cookie settings
    // TODO: restrict the cookie to https?
    res.cookie('jwt', jwt, { httpOnly: true, maxAge: 86400000, path: '/graphql' })

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
