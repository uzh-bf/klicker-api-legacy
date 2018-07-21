const FileService = require('../services/files')

const requestPresignedURLMutation = async (
  parentValue,
  { questionId, fileType },
  { auth },
) => FileService.requestPresignedURL({
  fileType,
  userId: auth.sub,
  questionId,
})

module.exports = {
  requestPresignedURL: requestPresignedURLMutation,
}
