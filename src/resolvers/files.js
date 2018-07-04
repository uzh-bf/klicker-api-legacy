const FileService = require('../services/files')

const requestPresignedURLMutation = async (parentValue, { id }, { auth }) => FileService.requestPresignedURL({})

module.exports = {
  requestPresignedURL: requestPresignedURLMutation,
}
