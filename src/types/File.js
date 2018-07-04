/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [File]

const File = `
  enum File_Type {
    PNG
    JPG
    GIF
  }

  input FileInput {
    fileName: String!
    fileType: File_Type!
  }

  type File {
    id: ID!
    title: String!
    type: Question_Type!
    isArchived: Boolean

    user: User!

    instances: [QuestionInstance!]!
    tags: [Tag!]!
    versions: [Question_Version!]!

    createdAt: String!
    updatedAt: String!
  }
`
