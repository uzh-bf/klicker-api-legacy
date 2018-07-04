const FileService = require('../services/files')

const requestPresignedURLMutation = (parentValue, { id }, { auth }) => FileService.requestPresignedURL()

module.exports = {
  requestPresignedURL: requestPresignedURLMutation,
}
