const graphql = require('graphql')

const { GraphQLObjectType, GraphQLString } = graphql
const UserType = require('./types/userType')

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    signup: {
      type: UserType,
      args: {
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve(parentValue, { email, password }, req) {
        return {
          id: 123,
          email,
          shortname: 'abcd',
          isActive: true,
          isAAI: false,
        }
      },
    },
  },
})

module.exports = mutation

/* query like

mutation Signup($email: String!, $password: String!) {
  signup(email: $email, password: $password) {
    id
    email
    shortname
    isActive
    isAAI
  }
}

{
  "email": "Helloworld",
  "password": "abc"
}

*/
