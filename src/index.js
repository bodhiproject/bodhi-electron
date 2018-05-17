const _ = require('lodash');
const path = require('path');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const { spawn } = require('child_process');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const EventEmitter = require('events');
const { app } = require('electron');
const fetch = require('node-fetch');
const portscanner = require('portscanner');

const { Config, isMainnet, getRPCPassword } = require('./config/config');
const { getLogger } = require('./utils/logger');
const Utils = require('./utils/utils');
const schema = require('./schema');
const syncRouter = require('./route/sync');
const apiRouter = require('./route/api');
const { startSync } = require('./sync');
const { ipcEvent, execFile } = require('./constants');
const { getInstance } = require('./qclient');
const Wallet = require('./api/wallet');

const emitter = new EventEmitter();

let qtumProcess;
let isEncrypted = false;
let checkInterval;
let checkApiInterval;
let shutdownInterval;

// Restify setup
function startRestifyServer() {
  server = restify.createServer({
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
      getLogger().debug(`${route.methods[0]} ${route.spec.path} ${res.statusCode}`);
    } else {
      getLogger().error(`${err.message}`);
    }
  });
}

startRestifyServer();

function isWalletEncrypted() {
  return isEncrypted;
}

function getQtumProcess() {
  return qtumProcess;
}

function startQtumProcess(reindex) {
  const flags = ['-logevents', '-rpcworkqueue=32', `-rpcuser=${Config.RPC_USER}`, `-rpcpassword=${getRPCPassword()}`];
  if (!isMainnet()) {
    flags.push('-testnet');
  }
  if (reindex) {
    flags.push('-reindex');
  }

  const qtumdPath = Utils.getQtumPath(execFile.QTUMD);
  getLogger().debug(`qtumd dir: ${qtumdPath}`);

  qtumProcess = spawn(qtumdPath, flags);
  getLogger().debug(`qtumd started on PID ${qtumProcess.pid}`);

  qtumProcess.stdout.on('data', (data) => {
    getLogger().debug(`qtumd output: ${data}`);
  });

  qtumProcess.stderr.on('data', (data) => {
    getLogger().error(`qtumd failed with error: ${data}`);

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
    getLogger().debug(`qtumd exited with code ${code}`);
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
    getLogger().info(`Bodhi App is running on http://${Config.HOSTNAME}:${Config.PORT}.`);
  });
}

function startServices() {
  startSync();
  startAPI();

  checkApiInterval = setInterval(checkApiInit, 500);
}

// Checks if the wallet is encrypted to prompt the wallet unlock dialog
async function checkWalletEncryption() {
  const res = await Wallet.getWalletInfo();
  isEncrypted = !_.isUndefined(res.unlocked_until);

  if (isEncrypted) {
    // Show wallet unlock prompt
    emitter.emit(ipcEvent.SHOW_WALLET_UNLOCK);
  } else {
    startServices();
  }
}

// Ensure API is running before loading UI
async function checkApiInit() {
  try {
    const res = await fetch(`http://${Config.HOSTNAME}:${Config.PORT}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"query":"{syncInfo{syncBlockNum,syncBlockTime,syncPercent}}"}',
    });

    if (res.status >= 200 && res.status < 300) {
      clearInterval(checkApiInterval);
      setTimeout(() => emitter.emit(ipcEvent.SERVICES_RUNNING), 1000);
    }
  } catch (err) {
    getLogger().debug(err.message);
  }
}

// Ensure qtumd is running before starting sync/API
async function checkQtumdInit() {
  try {
    // getInfo throws an error if trying to be called before qtumd is running
    const info = await getInstance().getInfo();

    // no error was caught, qtumd is initialized
    clearInterval(checkInterval);
    checkWalletEncryption();
  } catch (err) {
    getLogger().debug(err.message);
  }
}

// Check if qtumd port is in use before starting qtum-qt
function checkQtumPort() {
  const port = isMainnet() ? Config.RPC_PORT_MAINNET : Config.RPC_PORT_TESTNET;
  portscanner.checkPortStatus(port, Config.HOSTNAME, (error, status) => {
    if (status === 'closed') {
      clearInterval(shutdownInterval);

      // Slight delay before sending qtumd killed signal
      setTimeout(() => {
        emitter.emit(ipcEvent.QTUMD_KILLED);
      }, 1500);
    } else {
      getLogger().debug('waiting for qtumd to shutting down');
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
  getLogger().info(`Received ${signal}, exiting`);

  // add delay to give some time to write to log file
  setTimeout(() => {
    process.exit();
  }, 500);
}

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);

module.exports = {
  startQtumProcess,
  startServices,
  terminateDaemon,
  getQtumProcess,
  emitter,
  isWalletEncrypted,
  server,
};
