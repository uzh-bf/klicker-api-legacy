// @flow

const graphql = require('graphql')

const { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql

const mutation = require('./mutations')
const UserModel = require('../models/User')
const UserType = require('./types/userType')

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    activeUser: {
      type: UserType,
      args: { token: { type: GraphQLString } },
      resolve(parentValue, args) {
        return UserModel.findOne(args.token)
      },
    },
    allUsers: {
      type: new GraphQLList(UserType),
      resolve() {
        return UserModel.find({})
      },
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parentValue, args) {
        return UserModel.findOne(args.id)
      },
    },
  },
})

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
})
