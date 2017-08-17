// @flow

const graphql = require('graphql')

const { GraphQLBoolean, GraphQLDate, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql

const UserModel = require('../database/user')

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    email: { type: GraphQLString },
    shortname: { type: GraphQLString },
    isActive: { type: GraphQLBoolean },
    isAAI: { type: GraphQLBoolean },
    createdAt: { type: GraphQLDate },
    updatedAt: { type: GraphQLDate },
  }),
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    allUsers: {
      type: new GraphQLList(UserType),
      resolve() {
        return UserModel.find({})
      },
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return UserModel.findOne(args.id)
      },
    },
  },
})

module.exports = new GraphQLSchema({
  query: RootQuery,
})
