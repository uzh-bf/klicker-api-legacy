const FileService = require('../services/files')

const requestPresignedURLQuery = (parentValue, { id }, { auth }) => FileService.requestPresignedURL()

module.exports = {
  requestPresignedURL: requestPresignedURLQuery,
}
