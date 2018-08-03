const rp = require('request-promise')
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')

const CFG = require('../klicker.conf.js')

const EMAIL_CFG = CFG.get('email')
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

/**
 * Prepare a nodemailer transporter
 */
function prepareEmailTransporter() {
  // create reusable transporter object using the default SMTP transport
  const { host, port, secure, user, password: pass } = EMAIL_CFG
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

/**
 * Load and compile a handlebars template from disk
 * @param {String} templateName The filename of the template
 */
function compileEmailTemplate(templateName, templateParams) {
  const source = fs.readFileSync(path.join(__dirname, 'emails', `${templateName}.hbs`), 'utf8')
  const template = handlebars.compile(source)
  return template(templateParams)
}

/**
 * Send an email notification to a given address
 * @param {*} transporter
 */
async function sendEmailNotification({ to, subject, html }) {
  if (process.env.NODE_ENV !== 'test') {
    // prepare the email transport
    const transporter = prepareEmailTransporter()

    // send the email
    await transporter.sendMail({ from: EMAIL_CFG.from, to, subject, html })
  }
}

module.exports = {
  sendSlackNotification,
  prepareEmailTransporter,
  compileEmailTemplate,
  sendEmailNotification,
}
