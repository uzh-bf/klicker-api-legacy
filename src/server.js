/* eslint-disable global-require */
const { createServer } = require('http')
const mongoose = require('mongoose')

// import the configuration
const cfg = require('./klicker.conf.js')

// validate the configuration
// fail early if anything is invalid
cfg.validate({ allowed: 'strict' })

const isDev = process.env.NODE_ENV === 'development'
const hasRedis = cfg.get('cache.redis.enabled')

// initialize APM if so configured
if (cfg.get('services.apm.enabled')) {
  const { monitorDev, secretToken, serverUrl, serviceName } = cfg.get('services.apm')
  require('elastic-apm-node').start({
    active: monitorDev || !isDev,
    secretToken,
    serverUrl,
    serviceName,
  })
}

const { app, apollo } = require('./app')

let redis
if (hasRedis) {
  const { getRedis } = require('./redis')

  // get the redis singleton
  redis = getRedis()
}

// wrap express for websockets
const httpServer = createServer(app)
apollo.installSubscriptionHandlers(httpServer)

httpServer.listen(process.env.PORT, err => {
  if (err) throw err

  console.log(
    `[klicker-api] GraphQL ready on http://${process.env.APP_DOMAIN}:${process.env.PORT}${process.env.APP_PATH}!`
  )
})

const shutdown = async () => {
  console.log('[klicker-api] Shutting down server')

  await mongoose.disconnect()
  console.log('[mongodb] Disconnected')

  if (hasRedis) {
    await redis.disconnect()
    console.log('[redis] Disconnected')
  }

  console.log('[klicker-api] Shutdown complete')
  process.exit(0)
}

process.on('SIGINT', async () => shutdown())
process.on('exit', async () => shutdown())
process.once('SIGUSR2', async () => shutdown())
