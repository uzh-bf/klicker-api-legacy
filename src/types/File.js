/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [File]

const File = `
  type File_PresignedURL {
    fileName: String!
    signedUrl: String!
  }

  type File {
    id: ID!

    name: String!
    type: Question_Type!

    question: Question!
    user: User!

    createdAt: String!
    updatedAt: String!
  }
`
