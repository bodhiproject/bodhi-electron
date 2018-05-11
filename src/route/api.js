const { Router } = require('restify-router');

const Blockchain = require('../api/blockchain');
const Wallet = require('../api/wallet');
const AddressManager = require('../api/address_manager');
const BodhiToken = require('../api/bodhi_token');
const BaseContract = require('../api/base_contract');
const EventFactory = require('../api/event_factory');
const TopicEvent = require('../api/topic_event');
const Oracle = require('../api/oracle');
const CentralizedOracle = require('../api/centralized_oracle');
const DecentralizedOracle = require('../api/decentralized_oracle');
const Transaction = require('../api/transaction');
const QtumUtils = require('../api/qtum_utils');
const Emitter = require('../utils/emitterHelper');

const { getInstance } = require('../qclient');

const apiRouter = new Router();

function onRequestSuccess(res, result, next) {
  res.send(200, { result });
  next();
}

function onRequestError(res, err, next) {
  res.send(500, { error: err.message });
  next();
}

/* Misc */
apiRouter.post('/is-connected', (req, res, next) => {
  getInstance().isConnected()
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* QtumUtils */
apiRouter.post('/validate-address', (req, res, next) => {
  QtumUtils.validateAddress(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* Wallet */
apiRouter.post('/get-account-address', (req, res, next) => {
  Wallet.getAccountAddress(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/get-transaction', (req, res, next) => {
  Wallet.getTransaction(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.get('/get-wallet-info', (req, res, next) => {
  Wallet.getWalletInfo()
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.get('/list-address-groupings', (req, res, next) => {
  Wallet.listAddressGroupings()
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.get('/list-unspent', (req, res, next) => {
  Wallet.listUnspent()
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/wallet-passphrase', (req, res, next) => {
  Wallet.walletPassphrase(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/wallet-lock', (req, res, next) => {
  Wallet.walletLock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/encrypt-wallet', (req, res, next) => {
  Wallet.encryptWallet(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/wallet-passphrase-change', (req, res, next) => {
  Wallet.walletPassphraseChange(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/backup-wallet', (req, res, next) => {
console.log('​backup-wallet');

  Emitter.showSaveDialog();
});

apiRouter.post('/import-wallet', (req, res, next) => {
  console.log('​import-wallet');
  Emitter.showImportDialog();
});

/* Blockchain */
apiRouter.post('/get-block', (req, res, next) => {
  Blockchain.getBlock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.get('/get-blockchain-info', (req, res, next) => {
  Blockchain.getBlockchainInfo()
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.get('/get-block-count', (req, res, next) => {
  Blockchain.getBlockCount()
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/get-block-hash', (req, res, next) => {
  Blockchain.getBlockHash(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/get-transaction-receipt', (req, res, next) => {
  Blockchain.getTransactionReceipt(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/search-logs', (req, res, next) => {
  Blockchain.searchLogs(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* AddressManager */
apiRouter.post('/event-escrow-amount', (req, res, next) => {
  AddressManager.eventEscrowAmount(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/last-event-factory-index', (req, res, next) => {
  AddressManager.getLastEventFactoryIndex(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/last-oracle-factory-index', (req, res, next) => {
  AddressManager.getLastOracleFactoryIndex(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* BodhiToken */
apiRouter.post('/approve', (req, res, next) => {
  BodhiToken.approve(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/allowance', (req, res, next) => {
  BodhiToken.allowance(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/bot-balance', (req, res, next) => {
  BodhiToken.balanceOf(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* BaseContract */
apiRouter.post('/version', (req, res, next) => {
  BaseContract.version(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/get-result', (req, res, next) => {
  BaseContract.resultIndex(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/bet-balances', (req, res, next) => {
  BaseContract.getBetBalances(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/vote-balances', (req, res, next) => {
  BaseContract.getVoteBalances(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/total-bets', (req, res, next) => {
  BaseContract.getTotalBets(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/total-votes', (req, res, next) => {
  BaseContract.getTotalVotes(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* EventFactory */
apiRouter.post('/create-topic', (req, res, next) => {
  EventFactory.createTopic(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/event-factory-version', (req, res, next) => {
  EventFactory.version(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* TopicEvent */
apiRouter.post('/withdraw', (req, res, next) => {
  TopicEvent.withdrawWinnings(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/withdraw-escrow', (req, res, next) => {
  TopicEvent.withdrawEscrow(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/total-qtum-value', (req, res, next) => {
  TopicEvent.totalQtumValue(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/total-bot-value', (req, res, next) => {
  TopicEvent.totalBotValue(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/final-result', (req, res, next) => {
  TopicEvent.getFinalResult(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/status', (req, res, next) => {
  TopicEvent.status(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/did-withdraw', (req, res, next) => {
  TopicEvent.didWithdraw(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/winnings', (req, res, next) => {
  TopicEvent.calculateWinnings(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* Oracle */
apiRouter.post('/event-address', (req, res, next) => {
  Oracle.eventAddress(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/consensus-threshold', (req, res, next) => {
  Oracle.consensusThreshold(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/finished', (req, res, next) => {
  Oracle.finished(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* CentralizedOracle */
apiRouter.post('/bet', (req, res, next) => {
  CentralizedOracle.bet(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/set-result', (req, res, next) => {
  CentralizedOracle.setResult(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/oracle', (req, res, next) => {
  CentralizedOracle.oracle(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/bet-start-block', (req, res, next) => {
  CentralizedOracle.bettingStartBlock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/bet-end-block', (req, res, next) => {
  CentralizedOracle.bettingEndBlock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/result-set-start-block', (req, res, next) => {
  CentralizedOracle.resultSettingStartBlock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/result-set-end-block', (req, res, next) => {
  CentralizedOracle.resultSettingEndBlock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* DecentralizedOracle */
apiRouter.post('/vote', (req, res, next) => {
  DecentralizedOracle.vote(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/finalize-result', (req, res, next) => {
  DecentralizedOracle.finalizeResult(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/arbitration-end-block', (req, res, next) => {
  DecentralizedOracle.arbitrationEndBlock(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

apiRouter.post('/last-result-index', (req, res, next) => {
  DecentralizedOracle.lastResultIndex(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

/* Transactions */
apiRouter.post('/transaction-cost', (req, res, next) => {
  Transaction.transactionCost(req.params)
    .then((result) => {
      onRequestSuccess(res, result, next);
    }, (err) => {
      onRequestError(res, err, next);
    });
});

module.exports = apiRouter;
