const _ = require('lodash');
const path = require('path');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const { spawn } = require('child_process');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { Qweb3 } = require('qweb3');

const config = require('./config/config');
const logger = require('./utils/logger');
const schema = require('./schema');
const syncRouter = require('./route/sync');
const apiRouter = require('./route/api');
const startSync = require('./sync');
const IpcUtil = require('./utils/ipc_util');

const ipc = new IpcUtil(ipcRenderer);

const qclient = new Qweb3(config.QTUM_RPC_ADDRESS);

// Restify setup
const server = restify.createServer({
  title: 'Bodhi Synchroniser',
});
const cors = corsMiddleware({
  origins: ['*'],
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser({ mapParams: true }));
server.use(restify.plugins.queryParser());
server.on('after', (req, res, route, err) => {
  if (route) {
    ipc.logDebug(`${route.methods[0]} ${route.spec.path} ${res.statusCode}`);
  } else {
    ipc.logError(`${err.message}`);
  }
});

function startQtumProcess(reindex) {
  let basePath = './qtum/mac/bin';
  // if (_.includes(process.argv, '--dev')) {
  //   // dev path
  //   basePath = (_.split(process.argv[2], '=', 2))[1];
  // } else {
  //   // prod path
  //   basePath = `${path.dirname(process.argv[0])}/qtum`;
  // }

  // avoid using path.join for pkg to pack qtumd
  const qtumdPath = `${basePath}/qtumd`;
  ipc.logDebug(`qtumd dir: ${qtumdPath}`);

  const flags = ['-testnet', '-logevents', '-rpcuser=bodhi', '-rpcpassword=bodhi'];
  if (reindex) {
    flags.push('-reindex');
  }

  const qtumProcess = spawn(qtumdPath, flags);
  ipc.logDebug(`qtumd started on PID ${qtumProcess.pid}`);

  // Send pid to tracking in main.js
  ipc.newProcess(qtumProcess.pid);

  qtumProcess.stdout.on('data', (data) => {
    ipc.logDebug(`qtumd output: ${data}`);
  });

  qtumProcess.stderr.on('data', (data) => {
    ipc.logError(`qtumd failed with error: ${data}`);

    if (data.includes('You need to rebuild the database using -reindex-chainstate to enable -logevents.')) {
      // Clean old process first
      qtumProcess.kill();

      // Restart qtumd with reindex flag
      setTimeout(() => {
        console.log('Restarting and reindexing Qtum blockchain');
        startQtumProcess(true);
      }, 3000);
    } else {
      // add delay to give some time to write to log file
      setTimeout(() => {
        process.exit();
      }, 500);
    }
  });

  qtumProcess.on('close', (code) => {
    ipc.logDebug(`qtumd exited with code ${code}`);
  });
}

async function startAPI() {
  syncRouter.applyRoutes(server);
  apiRouter.applyRoutes(server);

  server.get(/\/?.*/, restify.plugins.serveStatic({
    directory: path.join(__dirname, '../ui'),
    default: 'index.html',
    maxAge: 0,
  }));

  server.listen(config.PORT, () => {
    SubscriptionServer.create(
      { execute, subscribe, schema },
      { server, path: '/subscriptions' },
    );
    ipc.logInfo(`Bodhi App is running on http://${config.HOSTNAME}:${config.PORT}.`);
  });
}

function startAllServices() {
  startQtumProcess(false);

  // Wait 5s for qtumd to start and reindex if necessary
  setTimeout(() => {
    startSync();
    startAPI();
  }, 5000);
}

function exit(signal) {
  ipc.logInfo(`Received ${signal}, exiting`);

  // add delay to give some time to write to log file
  setTimeout(() => {
    process.exit();
  }, 500);
}

async function startService() {
  if(!await qclient.isConnected()){
    logger.info('qtum is still starting, please wait');
    setTimeout(()=>{
      startService();
    },1000);
  }else{
    //add delay since the iscconected can also return true before qtum is fully running
    setTimeout(()=>{
      startSync();
      startAPI();
      openBrowser();
    },3000)
  }
}

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);

startQtumProcess(false);
