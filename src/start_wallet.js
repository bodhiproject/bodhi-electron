const { spawn } = require('child_process');

const { isMainnet } = require('./config/config');
const Utils = require('./utils/utils');
const logger = require('./utils/logger');
const { execFile } = require('./constants');

function startQtumWallet() {
  // Construct flags
  const flags = ['-logevents'];
  if (!isMainnet()) {
    flags.push('-testnet');
  }

  // Start qtum-qt
  const qtumPath = Utils.getQtumPath(execFile.QTUM_QT);
  logger.debug(`qtum-qt dir: ${qtumPath}`);

  const qtProcess = spawn(qtumPath, flags, {
    detached: true,
    stdio: 'ignore',
  });
  qtProcess.unref();
  logger.debug(`qtum-qt started on PID ${qtProcess.pid}`);

  // Kill backend process after qtum-qt has started
  setTimeout(() => {
    process.exit();
  }, 2000);
}

startQtumWallet();
