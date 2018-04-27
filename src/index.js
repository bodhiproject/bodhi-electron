const _ = require('lodash');
const path = require('path');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const { spawn } = require('child_process');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const EventEmitter = require('events');
const { app } = require('electron');
const portscanner = require('portscanner');

const { Config, isMainnet } = require('./config/config');
const logger = require('./utils/logger');
const Utils = require('./utils/utils');
const schema = require('./schema');
const syncRouter = require('./route/sync');
const apiRouter = require('./route/api');
const { startSync } = require('./sync');
const { ipcEvent, execFile } = require('./constants');

const qClient = require('./qclient').getInstance();

const emitter = new EventEmitter();

let qtumProcess;
let checkInterval;
let shutdownInterval;

// Restify setup
const server = restify.createServer({
  title: 'Bodhi Server',
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
    logger.debug(`${route.methods[0]} ${route.spec.path} ${res.statusCode}`);
  } else {
    logger.error(`${err.message}`);
  }
});

function startQtumProcess(reindex) {
  const flags = ['-logevents', '-rpcworkqueue=32', '-rpcuser=bodhi', '-rpcpassword=bodhi'];
  if (!isMainnet()) {
    flags.push('-testnet');
  }
  if (reindex) {
    flags.push('-reindex');
  }

  const qtumdPath = Utils.getQtumPath(execFile.QTUMD);
  logger.debug(`qtumd dir: ${qtumdPath}`);

  qtumProcess = spawn(qtumdPath, flags);
  logger.debug(`qtumd started on PID ${qtumProcess.pid}`);

  qtumProcess.stdout.on('data', (data) => {
    logger.debug(`qtumd output: ${data}`);
  });

  qtumProcess.stderr.on('data', (data) => {
    logger.error(`qtumd failed with error: ${data}`);

    if (data.includes('You need to rebuild the database using -reindex-chainstate to enable -logevents.')) {
      // Clean old process first
      qtumProcess.kill();
      clearInterval(checkInterval);
      // Restart qtumd with reindex flag
      setTimeout(() => {
        console.log('Restarting and reindexing Qtum blockchain');
        startQtumProcess(true);
      }, 3000);
    } else {
      // Emit startup error event to Electron listener
      emitter.emit(ipcEvent.STARTUP_ERROR, data.toString('utf-8'));

      // add delay to give some time to write to log file
      setTimeout(() => {
        process.exit();
      }, 500);
    }
  });

  qtumProcess.on('close', (code) => {
    logger.debug(`qtumd exited with code ${code}`);
  });

  // repeatedly check if qtumd is running
  checkInterval = setInterval(checkQtumdInit, 500);
}

async function startAPI() {
  syncRouter.applyRoutes(server);
  apiRouter.applyRoutes(server);

  server.get(/\/?.*/, restify.plugins.serveStatic({
    directory: path.join(__dirname, '../ui'),
    default: 'index.html',
    maxAge: 0,
  }));

  server.listen(Config.PORT, () => {
    SubscriptionServer.create(
      { execute, subscribe, schema },
      { server, path: '/subscriptions' },
    );
    logger.info(`Bodhi App is running on http://${Config.HOSTNAME}:${Config.PORT}.`);
  });
}

function startServices() {
  startSync();
  startAPI();

  setTimeout(() => {  
    emitter.emit(ipcEvent.QTUMD_STARTED);
  }, 1000);
}

async function checkQtumdInit() {
  try {
    // getInfo throws an error if trying to be called before qtumd is running
    const info = await qClient.getInfo();

    // no error was caught, qtumd is initialized
    clearInterval(checkInterval);
    startServices();
  } catch (err) {
    logger.debug(err.message);
  }
}

// Check if qtumd port is in use before starting qtum-qt
function checkQtumPort() {
  const port = isMainnet() ? Config.PORT_MAINNET : Config.PORT_TESTNET;
  portscanner.checkPortStatus(port, Config.HOSTNAME, (error, status) => {
    if (status === 'closed') {
      clearInterval(shutdownInterval);

      // Slight delay before sending qtumd killed signal
      setTimeout(() => {
        emitter.emit(ipcEvent.QTUMD_KILLED);
      }, 1500);
    } else {
      logger.debug('waiting for qtumd to shutting down');
    }
  });
}

function terminateDaemon() {
  if (qtumProcess) {
    qtumProcess.kill();
    shutdownInterval = setInterval(checkQtumPort, 500);
  }
}

function exit(signal) {
  logger.info(`Received ${signal}, exiting`);

  // add delay to give some time to write to log file
  setTimeout(() => {
    process.exit();
  }, 500);
}

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);

startQtumProcess(false);

exports.process = qtumProcess;
exports.emitter = emitter;
exports.terminateDaemon = terminateDaemon;
