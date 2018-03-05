const { graphqlRestify, graphiqlRestify } = require('apollo-server-restify');
const Router = require('restify-router').Router;

const connectDB = require('../db/nedb').connectDB;
const schema = require('../schema');
const { Config } = require('../config/config');

const syncRouter = new Router();

const graphQLOptions = async () => ({
  context: { db: await connectDB() },
  schema,
});

syncRouter.get('/graphql', graphqlRestify(graphQLOptions));
syncRouter.post('/graphql', graphqlRestify(graphQLOptions));

syncRouter.get('/graphiql', graphiqlRestify({
  endpointURL: '/graphql',
  subscriptionsEndpoint: `ws://${Config.HOSTNAME}:${Config.PORT}/subscriptions`,
}));

module.exports = syncRouter;
