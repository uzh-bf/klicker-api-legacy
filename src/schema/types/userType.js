const graphql = require('graphql')

const { GraphQLBoolean, GraphQLID, GraphQLObjectType, GraphQLString } = graphql

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    shortname: { type: GraphQLString },
    isActive: { type: GraphQLBoolean },
    isAAI: { type: GraphQLBoolean },
  }),
})

module.exports = UserType
