const { QuestionModel, TagModel, UserModel } = require('../models')

// process tags when editing or creating a question
const processTags = (existingTags, newTags, userId) => {
  // get references for the already existing tags
  const reusableTags = existingTags.filter(tag => newTags.includes(tag.name))
  const reusableTagNames = reusableTags.map(tag => tag.name)

  // if non-existent tags are passed, they need to be created
  const createdTags = [...new Set(newTags)]
    .filter(name => !reusableTagNames.includes(name))
    .map(name => new TagModel({ name, user: userId }))
  const createdTagIds = createdTags.map(tag => tag.id)

  // append the newly created tags to the list of tag ids
  const allTags = [...reusableTags, ...createdTags]
  const allTagIds = allTags.map(tag => tag.id)

  return {
    allTags,
    createdTags,
    allTagIds,
    createdTagIds,
  }
}

// create a new question
const createQuestion = async ({
  title, type, description, options, tags, userId,
}) => {
  // if no tags have been assigned, throw
  if (!tags || tags.length === 0) {
    throw new Error('NO_TAGS_SPECIFIED')
  }

  // if no options have been assigned, throw
  if (!options) {
    throw new Error('NO_OPTIONS_SPECIFIED')
  }

  // find the corresponding user
  const user = await UserModel.findById(userId).populate(['tags'])

  // process tags
  const { allTagIds, allTags, createdTagIds } = processTags(user.tags, tags, userId)

  // create a new question
  // pass the list of tag ids for reference
  // create an initial version "0" containing the description, options and solution
  const newQuestion = new QuestionModel({
    tags: allTagIds,
    title,
    type,
    user: userId,
    versions: [
      {
        description,
        options: {
          [type]: options,
        },
        solution: {},
      },
    ],
  })

  const allTagsUpdate = allTags.map((tag) => {
    tag.questions.push(newQuestion.id)
    return tag.save()
  })

  // push the new question and possibly tags into the user model
  user.questions.push(newQuestion.id)
  user.tags = user.tags.concat(createdTagIds)
  user.updatedAt = Date.now()

  // wait until the question and user both have been saved
  await Promise.all([newQuestion.save(), user.save(), ...allTagsUpdate])

  // return the new questions data
  return newQuestion
}

const modifyQuestion = async (questionId, userId, {
  title, tags, description, options,
}) => {
  const promises = []

  // check if both description and options are set for a new version
  if (description ? !options : options) {
    throw new Error('INVALID_VERSION_DEFINITION')
  }

  // if no tags have been assigned, throw
  if (tags && tags.length === 0) {
    throw new Error('NO_TAGS_SPECIFIED')
  }

  // get the question to be modified
  const question = await QuestionModel.findOne({ _id: questionId, user: userId }).populate(['tags'])
  if (!question) {
    throw new Error('INVALID_QUESTION')
  }

  // if the title is set to be modified
  if (title) {
    question.title = title
  }

  // if tags have been changed
  if (tags) {
    // find the corresponding user and corresponding tags
    const user = await UserModel.findById(userId).populate(['tags'])

    // process tags
    const { allTagIds, allTags } = processTags(user.tags, tags, userId)

    //
    const allTagsUpdate = allTags.map((tag) => {
      // if the tag doesn't already contain the question, add it
      if (!tag.questions.includes(questionId)) {
        tag.questions.push(questionId)
      }

      return tag.save()
    })

    // set the question tags to the new tag list
    question.tags = allTagIds

    // add the tag updates to promises
    promises.concat(allTagsUpdate)
  }

  // if description and options are set, add a new version
  if (description && options) {
    question.versions.push({
      description,
      options: {
        [question.type]: options,
      },
      solution: {},
    })
  }

  promises.push(question.save())

  await Promise.all(promises)

  return question
}

module.exports = {
  createQuestion,
  modifyQuestion,
}
