
// Shutdown qtumd and launch qtum-qt
function startQtumWallet() {
  // Wait for qtumd to shutdown properly
  setTimeout(() => {
    // Construct flags
    const flags = ['-logevents'];
    if (!isMainnet()) {
      flags.push('-testnet');
    }

    // Start qtum-qt
    const qtumPath = getQtumPath(false);
    const qtProcess = exec(qtumPath, flags);
    logger.debug(`qtum-qt started on PID ${qtProcess.pid}`);
  }, 4000);
}