const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')
const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const _get = require('lodash/get')
const { isLength, isEmail, normalizeEmail } = require('validator')
const { AuthenticationError, UserInputError } = require('apollo-server-express')

const CFG = require('../klicker.conf.js')
const { UserModel } = require('../models')
const { sendSlackNotification } = require('./notifications')
const { Errors } = require('../constants')
const { checkAvailability } = require('./accounts')

const APP_CFG = CFG.get('app')
const EMAIL_CFG = CFG.get('email')
const isDev = process.env.NODE_ENV !== 'production'

const AUTH_COOKIE_SETTINGS = {
  domain: APP_CFG.domain,
  httpOnly: true,
  maxAge: 86400000,
  path: APP_CFG.path ? `${APP_CFG.path}/graphql` : '/graphql',
  secure: !isDev && APP_CFG.https,
}

const generateJwtSettings = (user, scope = ['user']) => ({
  // expiresIn: 86400,
  sub: user.id,
  scope,
  shortname: user.shortname,
})

// check whether an authentication object is valid
const isAuthenticated = auth => {
  if (auth && auth.sub) {
    return true
  }
  return false
}

// HOC to ensure the requester is authenticated
// wraps a graphql resolver
const requireAuth = wrapped => (parentValue, args, context) => {
  if (!isAuthenticated(context.auth)) {
    throw new AuthenticationError('INVALID_LOGIN')
  }
  return wrapped(parentValue, args, context)
}

// check whether a JWT is valid
const isValidJWT = (jwt, secret) => {
  try {
    JWT.verify(jwt, secret)
    return true
  } catch ({ name }) {
    // if the token is expired, throw
    if (name === 'TokenExpiredError') {
      throw new AuthenticationError('TOKEN_EXPIRED')
    }

    return false
  }
}

// extract JWT from header or cookie
const getToken = req => {
  // try to parse an authorization cookie
  if (req.cookies && req.cookies.jwt && isValidJWT(req.cookies.jwt, APP_CFG.secret)) {
    return req.cookies.jwt
  }

  // try to parse the authorization header
  if (req.headers.authorization) {
    const split = req.headers.authorization.split(' ')

    if (split[0] === 'Bearer' && isValidJWT(split[1], APP_CFG.secret)) {
      return split[1]
    }
  }

  // if no token was found, but would be needed
  // additionally look for a token in the GraphQL variables (for normal and batch requests)
  const inlineJWT = _get(req, 'body.variables.jwt') || _get(req, 'body[0].variables.jwt')
  if (inlineJWT && isValidJWT(inlineJWT, APP_CFG.secret)) {
    return inlineJWT
  }

  // no token found
  return null
}

// signup a new user
// make this an async function such that it returns a promise
// we can later use this promise as a return value for resolvers or similar
const signup = async (email, password, shortname, institution, useCase, { isAAI, isActive } = {}) => {
  // TODO: activation of new accounts (send an email)

  if (!isEmail(email)) {
    throw new UserInputError(Errors.INVALID_EMAIL)
  }

  if (!isLength(password, { min: 8 })) {
    throw new UserInputError(Errors.INVALID_PASSWORD)
  }

  // normalize the email address
  const normalizedEmail = normalizeEmail(email)

  // check for the availability of the normalized email and the chosen shortname
  // throw an error if a matching account already exists
  const availability = await checkAvailability({ email: normalizedEmail, shortname })
  if (availability.email === false) {
    throw new UserInputError(Errors.EMAIL_NOT_AVAILABLE)
  }
  if (availability.shortname === false) {
    throw new UserInputError(Errors.SHORTNAME_NOT_AVAILABLE)
  }

  // generate a salt with bcrypt using 10 rounds
  // hash and salt the password
  const hash = bcrypt.hashSync(password, 10)

  // create a new user based on the passed data
  const newUser = await new UserModel({
    email: normalizedEmail,
    password: hash,
    shortname,
    institution,
    useCase,
    isAAI,
    isActive,
  }).save()

  if (newUser) {
    // send a slack notification (if configured)
    sendSlackNotification(
      `[auth] New user has registered: ${normalizedEmail}, ${shortname}, ${institution}, ${useCase || '-'}`
    )

    // return the data of the newly created user
    return newUser
  }

  throw new UserInputError('SIGNUP_FAILED')
}

// login an existing user
// make this an async function such that it returns a promise
// we can later use this promise as a return value for resolvers or similar
const login = async (res, email, password) => {
  if (!isEmail(email)) {
    throw new UserInputError(Errors.INVALID_EMAIL)
  }

  // normalize the email address
  const normalizedEmail = normalizeEmail(email)

  // look for a single user with the given email
  const user = await UserModel.findOne({ email: normalizedEmail })

  // check whether the user exists and hashed passwords match
  if (!user || !bcrypt.compareSync(password, user.password)) {
    sendSlackNotification(`[auth] Login failed for ${email}`)

    throw new AuthenticationError('INVALID_LOGIN')
  }

  // generate a JWT for future authentication
  // expiresIn: one day equals 86400 seconds
  // TODO: add more necessary properties for the JWT
  const jwt = JWT.sign(generateJwtSettings(user), APP_CFG.secret, {
    expiresIn: '1d',
  })

  // set a cookie with the generated JWT
  // domain: the domain the cookie should be valid for
  // maxAge: one day equals 86400000 milliseconds
  // path: cookie should only be valid for the graphql API
  // httpOnly: don't allow interactions from javascript
  // secure: whether the cookie should only be sent over https
  // TODO: set other important cookie settings
  if (res && res.cookie) {
    res.cookie('jwt', jwt, AUTH_COOKIE_SETTINGS)
  }

  // update the last login date
  await UserModel.findOneAndUpdate(
    { email },
    {
      $currentDate: { lastLoginAt: true, updatedAt: true },
    }
  )

  // resolve with data about the user
  return user.id
}

// log the user out (remove the cookie and redirect)
const logout = async res => {
  if (res && res.cookie) {
    res.cookie('jwt', null, {
      ...AUTH_COOKIE_SETTINGS,
      maxAge: -1,
    })
  }
  return 'LOGGED_OUT'
}

// change the password of an existing user
const changePassword = async (userId, newPassword) => {
  // look for a user with the given id
  // and check whether the user exists
  const user = await UserModel.findById(userId)
  if (!user) {
    throw new UserInputError('PASSWORD_UPDATE_FAILED')
  }

  // generate a salt with bcyrpt using 10 rounds
  // hash and salt the password
  // set the new password and save the user
  user.password = bcrypt.hashSync(newPassword, 10)
  const updatedUser = await user.save()
  if (!updatedUser) {
    throw new UserInputError('PASSWORD_UPDATE_FAILED')
  }

  // return the updated user
  return updatedUser
}

// request a password reset link
const requestPassword = async (res, email) => {
  if (!isEmail(email)) {
    throw new UserInputError(Errors.INVALID_EMAIL)
  }

  // normalize the email address
  const normalizedEmail = normalizeEmail(email)

  // look for a user with the given email
  // and check whether the user exists
  const user = await UserModel.findOne({ email: normalizedEmail })
  if (!user) {
    return 'PASSWORD_RESET_FAILED'
  }

  // generate a temporary JWT for password reset
  const jwt = JWT.sign(generateJwtSettings(user), APP_CFG.secret, {
    expiresIn: '1d',
  })

  // create reusable transporter object using the default SMTP transport
  const { host, port, secure, user: emailUser, password: pass } = EMAIL_CFG
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: emailUser, pass },
  })

  // load the template source and compile it
  const source = fs.readFileSync(path.join(__dirname, 'emails', 'passwordReset.hbs'), 'utf8')
  const template = handlebars.compile(source)

  // send mail with defined transport object
  if (process.env.NODE_ENV !== 'test') {
    try {
      await transporter.sendMail({
        // bcc: 'roland.schlaefli@bf.uzh.ch',
        from: EMAIL_CFG.from,
        to: user.email,
        subject: 'Klicker UZH - Password Reset',
        html: template({
          email: user.email,
          jwt,
        }),
      })

      // notify slack that a password has been requested
      sendSlackNotification(`[auth] Password has been requested for: ${user.email}`)
    } catch (e) {
      return 'PASSWORD_RESET_FAILED'
    }
  }

  return 'PASSWORD_RESET_SENT'
}

/**
 * Request account deletion
 * Send a deletion token to the stored email
 * @param {*} userId
 */
const requestAccountDeletion = async userId => {
  // get the user from the database
  const user = await UserModel.findById(userId)

  // generate a jwt that is valid for account deletion
  const jwt = JWT.sign(generateJwtSettings(user, ['delete']), process.env.APP_SECRET, {
    expiresIn: '1d',
  })

  console.log(jwt)

  // TODO: send the token via email
  // TODO:
}

/**
 * Perform account deletion
 * Validate the deletion token previosuly sent to the stored email
 * @param {*} userId
 * @param {*} deletionToken
 */
const performAccountDeletion = async (userId, deletionToken) => {
  // TODO: validate the deletion token
  // TODO: perform account deletion
}

module.exports = {
  isAuthenticated,
  requireAuth,
  isValidJWT,
  getToken,
  signup,
  login,
  logout,
  changePassword,
  requestPassword,
}
