const _isNumber = require('lodash/isNumber')
// TODO: find a way to use draft.js without needing react and react-dom
const { ContentState, convertToRaw } = require('draft-js')

const { QuestionModel, TagModel, UserModel } = require('../models')
const { QUESTION_GROUPS, QUESTION_TYPES } = require('../constants')
const { convertToPlainText } = require('../lib/draft')

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
  title,
  type,
  content,
  options,
  solution,
  tags,
  userId,
}) => {
  // if no tags have been assigned, throw
  if (!tags || tags.length === 0) {
    throw new Error('NO_TAGS_SPECIFIED')
  }

  // if no options have been assigned, throw
  if (QUESTION_GROUPS.WITH_OPTIONS.includes(type) && !options) {
    throw new Error('NO_OPTIONS_SPECIFIED')
  }

  // validation for SC and MC questions
  if (QUESTION_GROUPS.CHOICES.includes(type)) {
    if (options.choices.length === 0) {
      throw new Error('NO_CHOICES_SPECIFIED')
    }

    if (solution && options.choices.length !== solution[type].length) {
      throw new Error('INVALID_SOLUTION')
    }
  }

  // validation for FREE_RANGE questions
  if (type === QUESTION_TYPES.FREE_RANGE) {
    if (!options.restrictions) {
      throw new Error('MISSING_RESTRICTIONS')
    }

    // if at least one restriction is set, the restrictions need to be evaluated
    if (options.restrictions.min || options.restrictions.max) {
      const isMinNum = !options.restrictions.min || _isNumber(options.restrictions.min)
      const isMaxNum = !options.restrictions.max || _isNumber(options.restrictions.max)
      if (
        !isMinNum
        || !isMaxNum
        || (options.restrictions.min
          && options.restrictions.max
          && options.restrictions.max <= options.restrictions.min)
      ) {
        throw new Error('INVALID_RESTRICTIONS')
      }
    }
  }
  // find the corresponding user
  const user = await UserModel.findById(userId).populate(['tags'])

  // process tags
  const { allTagIds, allTags, createdTagIds } = processTags(
    user.tags,
    tags,
    userId,
  )

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
        content,
        description: convertToPlainText(content),
        options: QUESTION_GROUPS.WITH_OPTIONS.includes(type) && {
          [type]: options,
        },
        solution,
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

const modifyQuestion = async (
  questionId,
  userId,
  {
    title, tags, content, options, solution,
  },
) => {
  const promises = []

  // check if both content and options are set for a new version
  if (content ? !options : options) {
    throw new Error('INVALID_VERSION_DEFINITION')
  }

  // if no tags have been assigned, throw
  if (tags && tags.length === 0) {
    throw new Error('NO_TAGS_SPECIFIED')
  }

  // get the question to be modified
  const question = await QuestionModel.findOne({
    _id: questionId,
    user: userId,
  }).populate(['tags'])
  if (!question) {
    throw new Error('INVALID_QUESTION')
  }

  if (
    QUESTION_GROUPS.CHOICES.includes(question.type)
    && solution
    && options.choices.length !== solution[question.type].length
  ) {
    throw new Error('INVALID_SOLUTION')
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
    const { allTags, allTagIds } = processTags(user.tags, tags, userId)

    // update all tags to contain the question
    const allTagsUpdate = allTags.map((tag) => {
      // if the tag doesn't already contain the question, add it
      if (!tag.questions.includes(questionId)) {
        tag.questions.push(questionId)
      }

      return tag.save()
    })

    const oldTags = question.tags.filter(
      prevTag => !allTagIds.includes(prevTag.id),
    )
    const oldTagsUpdate = oldTags.map((tag) => {
      // remove the current question from any old tag
      tag.questions = tag.questions.filter(({ id }) => id !== question.id) // eslint-disable-line

      return tag.save()
    })

    // set the question tags to the new tag list
    question.tags = allTagIds

    // replace the users tags
    user.tags = Array.from(new Set([...user.tags, ...allTags]))

    // add the tag updates to promises
    promises.concat(user.save(), allTagsUpdate, oldTagsUpdate)
  }

  // migrate old question versions without content field
  for (let i = 0; i < question.versions.length; i += 1) {
    // if the content field is not set on any old version
    if (!question.versions[i].content) {
      // get the description of the old version
      const { description } = question.versions[i]

      // instantiate a content state
      const contentState = ContentState.createFromText(description)

      // convert the content state to raw json
      const rawContent = JSON.stringify(convertToRaw(contentState))

      // set the content of the version to the raw state
      question.versions[i].content = rawContent
      question.markModified(`versions.${i}`)
    }
  }

  // TODO: ensure that content is not empty
  // if content and options are set, add a new version
  if (content && options) {
    question.versions.push({
      content,
      description: convertToPlainText(content),
      options: QUESTION_GROUPS.WITH_OPTIONS.includes(question.type) && {
        // HACK: manually ensure randomized is default set to false
        // TODO: mongoose should do this..?
        [question.type]: QUESTION_GROUPS.CHOICES.includes(question.type)
          ? { randomized: false, ...options }
          : options,
      },
      solution,
    })
  }

  promises.push(question.save())

  await Promise.all(promises)

  return question
}

const archiveQuestions = async (questionIds, userId) => {
  // get the question instance from the DB
  const questions = await QuestionModel.find({
    _id: { $in: questionIds },
    user: userId,
  })

  // set the questions to be archived if it does not yet have the attribute
  // otherwise invert the previously set value
  const promises = questions.map((question) => {
    // eslint-disable-next-line no-param-reassign
    question.isArchived = !question.isArchived
    return question.save()
  })

  // await the question update promises
  return Promise.all(promises)
}

module.exports = {
  createQuestion,
  modifyQuestion,
  archiveQuestions,
}
