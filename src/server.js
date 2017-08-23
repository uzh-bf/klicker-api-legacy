// @flow

require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express')
const schema = require('./schema')
const mongoose = require('mongoose')
const jwt = require('express-jwt')

const dev = process.env.NODE_ENV !== 'production'

mongoose.Promise = Promise

mongoose.connect(
  `mongodb://${process.env.MONGO_URL || 'klicker:klicker@ds161042.mlab.com:61042/klicker-dev'}`,
)

mongoose.connection
  .once('open', () => {
    console.log('hello mongo!')
  })
  .on('error', (error) => {
    console.warn('Warning', error)
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
    secret: process.env.JWT_SECRET || 'hello-world',
  }),
  bodyParser.json(),
  graphqlExpress({ schema }),
)

// expose GraphQL and GraphiQL in dev mode
// as GraphiQL cannot handle JWT authentication, don't check tokens in development
// TODO: will probably need to mock JWT's here
/* if (dev) {
  server.use('/graphql-dev', bodyParser.json(), graphqlExpress({ schema }))
  server.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql-dev' }))
} */

server.listen(3000, (err) => {
  if (err) throw err
  console.log('> Ready on http://localhost:3000')
})
