const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken')

const { UserModel } = require('../models')

const dev = process.env.NODE_ENV !== 'production'

const isAuthenticated = (auth) => {
  if (!auth || !auth.sub) {
    throw new Error('INVALID_LOGIN')
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

// make this an async function such that it returns a promise
// we can later use this promise as a return value for resolvers or similar
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

  if (newUser) {
    return newUser
  }

  throw new Error('SIGNUP_FAILED')
}

// make this an async function such that it returns a promise
// we can later use this promise as a return value for resolvers or similar
const login = async (res, email, password) => {
  // look for a single user with the given email
  const user = await UserModel.findOne({ email })

  // check whether the user exists and hashed passwords match
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new Error('INVALID_LOGIN')
  }

  // generate a JWT for future authentication
  // expiresIn: one day equals 86400 seconds
  // TODO: add more necessary properties for the JWT
  const jwt = JWT.sign({ expiresIn: 86400, sub: user.id, scope: ['user'] }, process.env.APP_SECRET)

  // set a cookie with the generated JWT
  // domain: the domain the cookie should be valid for
  // maxAge: one day equals 86400000 milliseconds
  // path: cookie should only be valid for the graphql API
  // httpOnly: don't allow interactions from javascript
  // secure: whether the cookie should only be sent over https
  // TODO: set other important cookie settings
  if (res && res.cookie) {
    res.cookie('jwt', jwt, {
      domain: process.env.APP_DOMAIN,
      httpOnly: true,
      maxAge: 86400000,
      path: '/graphql',
      secure: !dev,
    })
  }

  // resolve with data about the user
  return user
}

module.exports = {
  isAuthenticated,
  isValidJWT,
  signup,
  login,
}
