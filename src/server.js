// @flow

require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const { graphqlExpress } = require('apollo-server-express')
const schema = require('./schema')
const mongoose = require('mongoose')
const jwt = require('express-jwt')

mongoose.Promise = Promise

if (!process.env.MONGO_URL) {
  console.warn('> Error: Please pass the MONGO_URL as an environment variable.')
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.warn('> Error: Please pass the JWT_SECRET as an environment variable.')
  process.exit(1)
}

mongoose.connect(`mongodb://${process.env.MONGO_URL}`)

mongoose.connection
  .once('open', () => {
    console.log('> Connection to MongoDB established.')
  })
  .on('error', (error) => {
    console.warn('> Warning: ', error)
  })

// initialize an express server
const server = express()

// expose the GraphQL API endpoint
// parse JWT that are passed as a header and attach their content to req.user
server.use(
  '/graphql',
  jwt({
    credentialsRequired: false,
    requestProperty: 'auth',
    secret: process.env.JWT_SECRET,
  }),
  bodyParser.json(),
  graphqlExpress(req => ({ context: { auth: req.auth }, schema })),
)

server.listen(3000, (err) => {
  if (err) throw err
  console.log('> API ready on http://localhost:3000!')
})
