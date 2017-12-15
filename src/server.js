/* eslint-disable global-require */

// initialize opbeat if so configured
if (process.env.APM_SERVER_URL) {
  /* require('opbeat').start({
    active: process.env.NODE_ENV === 'production',
    appId: process.env.OPBEAT_APP_ID,
    organizationId: process.env.OPBEAT_ORG_ID,
    secretToken: process.env.OPBEAT_SECRET_TOKEN,
  }) */

  require('elastic-apm-node').start({
    active: process.env.NODE_ENV === 'production',
    appName: process.env.APM_NAME,
    secretToken: process.env.APM_SECRET_TOKEN,
    serverUrl: process.env.APM_SERVER_URL,
  })
}

/* eslint-disable global-require */
const mongoose = require('mongoose')
const server = require('./app')
const { getRedis } = require('./redis')

const redis = getRedis()

server.listen(process.env.PORT, (err) => {
  if (err) throw err
  console.log(`[klicker-api] ready on http://localhost:${process.env.PORT}!`)
})

process.on('exit', () => {
  console.log('[klicker-api] Shutting down server')
  mongoose.disconnect()
  redis.disconnect()

  console.log('[klicker-api] Shutdown complete')
  process.exit(0)
})

process.once('SIGUSR2', () => {
  console.log('[klicker-api] Shutting down server')
  mongoose.disconnect()
  redis.disconnect()

  console.log('[klicker-api] Shutdown complete')
  process.exit(0)
})
