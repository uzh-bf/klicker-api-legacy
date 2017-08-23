// @flow

require('dotenv').config()

const bodyParser = require('body-parser')
const express = require('express')
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express')
const schema = require('./schema')
const mongoose = require('mongoose')

mongoose.Promise = Promise

mongoose.connect('mongodb://klicker:klicker@ds161042.mlab.com:61042/klicker-dev')
mongoose.connection
  .once('open', () => {
    console.log('hello mongo!')
  })
  .on('error', (error) => {
    console.warn('Warning', error)
  })

const dev = process.env.NODE_ENV !== 'production'

const server = express()

server.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))
if (dev) server.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))

server.listen(3000, (err) => {
  if (err) throw err
  console.log('> Ready on http://localhost:3000')
})
