const Redis = require('ioredis')

let redis
const getRedis = () => {
  if (process.env.NODE_ENV === 'test') {
    return null
  }

  if (redis) {
    return redis
  }

  if (process.env.REDIS_URL) {
    console.log('> Connected to redis')

    redis = new Redis(`redis://${process.env.REDIS_URL}`)
    return redis
  }

  return null
}

module.exports = {
  getRedis,
}
