const { spawn } = require('child_process');

const { isMainnet } = require('./config/config');
const Utils = require('./utils/utils');
const logger = require('./utils/logger');

function startQtumWallet() {
  // Construct flags
  const flags = ['-logevents'];
  if (!isMainnet()) {
    flags.push('-testnet');
  }

  // Start qtum-qt
  const qtumPath = Utils.getQtumPath(false);
  logger.debug(`qtum-qt dir: ${qtumPath}`);

  const qtProcess = spawn(qtumPath, flags);
  logger.debug(`qtum-qt started on PID ${qtProcess.pid}`);

  // Kill backend process after qtum-qt has started
  setTimeout(() => {
    process.exit();
  }, 2000);
}

startQtumWallet();
