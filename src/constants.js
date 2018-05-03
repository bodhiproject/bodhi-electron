module.exports = {
  blockchainEnv: {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
  },

  ipcEvent: {
    QTUMD_KILLED: 'qtumd-killed',
    STARTUP_ERROR: 'startup-error',
    SHOW_WALLET_UNLOCK: 'show-wallet-unlock',
    SERVICES_RUNNING: 'services-running',
  },

  txState: {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAIL: 'FAIL',
  },

  execFile: {
    QTUMD: 'qtumd',
    QTUM_QT: 'qtum-qt',
  },

  BLOCK_0_TIMESTAMP: 1504695029,
  SATOSHI_CONVERSION: 10 ** 8,
};
