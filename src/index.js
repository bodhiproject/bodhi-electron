const _ = require('lodash');
const path = require('path');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const { spawn } = require('child_process');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const EventEmitter = require('events');
const { app } = require('electron');

const { Config, isMainnet } = require('./config/config');
const logger = require('./utils/logger');
const schema = require('./schema');
const syncRouter = require('./route/sync');
const apiRouter = require('./route/api');
const { startSync } = require('./sync');
const { ipcEvent } = require('./constants');

const qClient = require('./qclient').getInstance();

const emitter = new EventEmitter();

let qtumProcess;
let checkInterval;

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

async function checkQtumd() {
  const running = await qClient.isConnected();
  if (running) {
    clearInterval(checkInterval);
    startServices();
  }
}

/*
* Gets the dev env qtum path for either qtumd or qtum-qt.
* @param forDaemon {Boolean} Flag to get qtumd or not.
* return {String} The full dev path for qtumd or qtum-qt.
*/
function getDevQtumPath(forDaemon) {
  // dev, must pass in the absolute path to the bin/ folder
  qtumPath = (_.split(process.argv[2], '=', 2))[1];
  if (forDaemon) {
    return `${qtumPath}/qtumd`;
  }
  return `${qtumPath}/qtum-qt`;
}

/*
* Gets the prod env qtum path for either qtumd or qtum-qt.
* @param forDaemon {Boolean} Flag to get qtumd or not.
* return {String} The full prod path for qtumd or qtum-qt.
*/
function getProdQtumPath(forDaemon) {
  const arch = process.arch;
  let path;
  switch (process.platform) {
    case 'darwin': {
      if (forDaemon) {
        path = `${app.getAppPath()}/qtum/mac/bin/qtumd`;
      }

      path = `${app.getAppPath()}/qtum/mac/bin/qtum-qt`;
    }
    case 'win32': {
      if (arch === 'x64') {
        if (forDaemon) {
          path = `${app.getAppPath()}/qtum/win64/bin/qtumd.exe`;
        }
        path = `${app.getAppPath()}/qtum/win64/bin/qtum-qt.exe`;
      }

      if (forDaemon) {
        path = `${app.getAppPath()}/qtum/win32/bin/qtumd.exe`;
      }
      path = `${app.getAppPath()}/qtum/win32/bin/qtum-qt.exe`;
    }
    case 'linux': {
      if (arch === 'x64') {
        if (forDaemon) {
          path = `${app.getAppPath()}/qtum/linux64/bin/qtumd`;
        }
        path = `${app.getAppPath()}/qtum/linux64/bin/qtum-qt`;
      } else if (arch === 'x32') {
        if (forDaemon) {
          path = `${app.getAppPath()}/qtum/linux32/bin/qtumd`;
        }
        path = `${app.getAppPath()}/qtum/linux32/bin/qtum-qt`;
      }
      throw new Error(`Linux arch ${arch} not supported`);
    }
    default: {
      throw new Error('Operating system not supported');
    }
  }

  return path.replace('app.asar', 'app.asar.unpacked');
}

function getQtumPath(forDaemon) {
  let qtumPath;
  if (_.includes(process.argv, '--dev')) {
    qtumPath = getDevQtumPath(forDaemon);
  } else {
    qtumPath = getProdQtumPath(forDaemon);
  }
  logger.debug(`qtum dir: ${qtumPath}`);
  return qtumPath;
}

function startQtumProcess(reindex) {
  const flags = ['-logevents', '-rpcworkqueue=32', '-rpcuser=bodhi', '-rpcpassword=bodhi'];
  if (!isMainnet()) {
    flags.push('-testnet');
  }
  if (reindex) {
    flags.push('-reindex');
  }

  const qtumdPath = getQtumPath(true);
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
  checkInterval = setInterval(checkQtumd, 1000);
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
  setTimeout(() => {
    startSync();
    startAPI();
    emitter.emit(ipcEvent.QTUMD_STARTED);
  }, 3000);
}

// Shutdown qtumd and launch qtum-qt
function startQtumWallet() {
  exit();

  // Wait for qtumd to shutdown properly
  setTimeout(() => {
    // Construct flags
    const flags = ['-logevents'];
    if (!isMainnet()) {
      flags.push('-testnet');
    }

    // Start qtum-qt
    const qtumPath = getQtumPath(false);
    const qtProcess = spawn(qtumPath, flags);
    logger.debug(`qtum-qt started on PID ${qtProcess.pid}`);
  }, 4000);
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
