// TODO: extract emails into separate service
const rp = require('request-promise')

const CFG = require('../klicker.conf.js')

const SLACK_CFG = CFG.get('services.slack')

/**
 * Send a slack notification (if enabled)
 * @param {String} text The contents to be sent to slack
 */
async function sendSlackNotification(text) {
  // check if slack integration is appropriately configured
  if (process.env.NODE_ENV === 'production' && SLACK_CFG.enabled) {
    // console.log(`> Sending slack notification: ${text}`)

    return rp({
      method: 'POST',
      uri: SLACK_CFG.webhook,
      body: {
        text,
      },
      json: true,
    })
  }

  return null
}

module.exports = {
  sendSlackNotification,
}
