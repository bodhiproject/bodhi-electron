const restify = require('restify');
const cors = require('cors');
const { spawn } = require('child_process');

// This package automatically parses JSON requests.
const bodyParser = require('body-parser');

// This package will handle GraphQL server requests and responses
// for you, based on your schema.
const { graphqlRestify, graphiqlRestify } = require('apollo-server-restify');


const schema = require('./schema');

const connectDB = require('./db/nedb');
const startSync = require('./sync');

const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');


const startAPI = async () => {
  const db = await connectDB();

  const server = restify.createServer({
    title: 'Bodhi Synchroniser',
  });

  const PORT = 5555;
  // app.use(cors());
  const graphQLOptions = { context: { db }, schema };

  server.use(restify.plugins.bodyParser());
  server.use(restify.plugins.queryParser());

  server.get('/graphql', graphqlRestify(graphQLOptions));
  server.post('/graphql', graphqlRestify(graphQLOptions));

  server.get('/graphiql', graphiqlRestify({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
  }));

  server.listen(PORT, () => {
    SubscriptionServer.create(
      { execute, subscribe, schema },
      { server, path: '/subscriptions' },
    );
    console.log(`Bodhi API GraphQL server running on http://localhost:${PORT}.`);
  });
};

const qtumprocess = spawn('./qtum/bin/qtumd', ['-testnet', '-logevents', '-rpcuser=bodhi', '-rpcpassword=bodhi']);

qtumprocess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

qtumprocess.stderr.on('data', (data) => {
  console.log(`qtum node cant start with error: ${data}`);
  process.exit();
});

qtumprocess.on('close', (code) => {
  console.log(`qtum node exited with code ${code}`);
  process.exit();
});

function handle(signal) {
  console.log(`Received ${signal}, exiting`);
  qtumprocess.kill();
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);

// 3s is sufficient for qtumd to start
setTimeout(() => {
  startSync();
  startAPI();
}, 3000);
