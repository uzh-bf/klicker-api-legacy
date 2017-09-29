const { TagModel, UserModel } = require('../models')

/* ----- queries ----- */
const allTagsQuery = async (parentValue, args, { auth }) => {
  const user = await UserModel.findById(auth.sub).populate(['tags'])
  return user.tags
}

const tagQuery = (parentValue, { id }, { auth }) => TagModel.findOne({ id, user: auth.sub })

/* ----- mutations ----- */
const createTagMutation = async (parentValue, { tag: { name } }, { auth }) => {
  const newTag = new TagModel({
    name,
    user: auth.sub,
  })

  const updatedUser = UserModel.update(
    { _id: auth.sub },
    {
      $push: { tags: newTag.id },
      $currentDate: { updatedAt: true },
    },
  )

  await Promise.all([newTag.save(), updatedUser])

  return newTag
}

module.exports = {
  allTags: allTagsQuery,
  createTag: createTagMutation,
  tag: tagQuery,
}
