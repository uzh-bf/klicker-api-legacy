const FileService = require('../services/files')

const requestPresignedURLMutation = async (
  parentValue,
  { fileType },
  { auth },
) => FileService.requestPresignedURL({
  fileType,
  userId: auth.sub,
})

module.exports = {
  requestPresignedURL: requestPresignedURLMutation,
}
