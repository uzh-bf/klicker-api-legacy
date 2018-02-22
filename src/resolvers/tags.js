const { TagModel } = require('../models')

/* ----- queries ----- */
const allTagsQuery = async (parentValue, args, { auth }) => TagModel.find({ user: auth.sub }).sort({ name: 1 })

const tagByIDQuery = (parentValue, { id }, { loaders }) => loaders.tags.load(id)
const tagsByPVQuery = (parentValue, args, { loaders }) => loaders.tags.loadMany(parentValue.tags)

module.exports = {
  // queries
  allTags: allTagsQuery,
  tag: tagByIDQuery,
  tags: tagsByPVQuery,
}
