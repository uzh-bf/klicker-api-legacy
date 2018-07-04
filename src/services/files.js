const AWS = require('aws-sdk')
const UUID = require('uuid/v4')

const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  endpoint: new AWS.Endpoint(process.env.AWS_ENDPOINT),
  secretAccessKey: process.env.AWS_SECRET_KEY,
})

const requestPresignedURL = async ({ userId, questionId }) => {
  // TODO: compute a sensible scoped filename
  const fileName = `${userId}/${questionId}/${UUID()}`

  return S3.getSignedUrl('putObject', {
    Bucket: process.env.AWS_BUCKET,
    // ContentType: 'image/png',
    Key: fileName,
  })
}

module.exports = { requestPresignedURL }
