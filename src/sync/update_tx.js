const _ = require('lodash');
const moment = require('moment');

const logger = require('../utils/logger');
const blockchain = require('../api/blockchain');
const bodhiToken = require('../api/bodhi_token');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/nedb').DBHelper;

const Constants = require('../constants');

async function updatePendingTxs(db) {
  let pendingTxs;
  try {
    pendingTxs = await db.Transactions.cfind({ status: Constants.PENDING })
      .sort({ createdTime: -1 }).exec();
  } catch (err) {
    logger.error(`Error: get pending Transactions: ${err.message}`);
    throw err;
  }

  // TODO(frank): batch to void too many rpc calls
  const updatePromises = [];
  _.each(pendingTxs, (tx) => {
    updatePromises.push(new Promise(async (resolve) => {
      await updateTx(tx);
      await updateDB(tx, db);
      resolve();
    }));
  });
  await Promise.all(updatePromises);
}

// Update the Transaction info
async function updateTx(tx) {
  const resp = await blockchain.getTransactionReceipt({ transactionId: tx._id });

  if (_.isEmpty(resp)) {
    tx.status = Constants.PENDING;
  } else {
    const blockInfo = await blockchain.getBlock({ blockHash: resp[0].blockHash });

    tx.status = _.isEmpty(resp[0].log) ? Constants.FAIL : Constants.SUCCESS;
    tx.gasUsed = resp[0].gasUsed;
    tx.blockNum = resp[0].blockNumber;
    tx.blockTime = blockInfo.time;
  }
}

// Update the DB with new Transaction info
async function updateDB(tx, db) {
  if (tx.status !== Constants.PENDING) {
    try {
      logger.debug(`Update: Transaction ${tx.type} txid:${tx._id}`);
      const updateRes = await db.Transactions.update(
        { _id: tx._id },
        {
          $set: {
            status: tx.status,
            gasUsed: tx.gasUsed,
            blockNum: tx.blockNum,
          },
        },
        {
          returnUpdatedDocs: true,
        },
      );
      const updatedTx = updateRes[1];

      // Execute follow up tx
      if (updatedTx) {
        switch (updatedTx.status) {
          case Constants.SUCCESS: {
            await executeFollowUpTx(updatedTx, db);
            break;
          }
          case Constants.FAIL: {
            await onFailedTx(updatedTx, db);
            break;
          }
          default: {
            break;
          }
        }
      }
    } catch (err) {
      logger.error(`Error: Update Transaction ${tx.type} txid:${tx._id}: ${err.message}`);
      throw err;
    }
  }
}

// Execute follow-up transaction for successful txs
async function executeFollowUpTx(tx, db) {
  const Transactions = db.Transactions;
  let txid;
  switch (tx.type) {
    // Approve was reset to 0. Sending approve for consensusThreshold.
    case 'RESETAPPROVESETRESULT': {
      try {
        const approveTx = await bodhiToken.approve({
          spender: tx.topicAddress,
          value: tx.amount,
          senderAddress: tx.senderAddress,
        });
        txid = approveTx.txid;
      } catch (err) {
        logger.error(`Error calling BodhiToken.approve: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        _id: txid,
        txid,
        version: tx.version,
        type: 'APPROVESETRESULT',
        status: Constants.PENDING,
        senderAddress: tx.senderAddress,
        topicAddress: tx.topicAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
        createdTime: moment().unix(),
      });
      break;
    }

    // Approve was accepted. Sending setResult.
    case 'APPROVESETRESULT': {
      try {
        const setResultTx = await centralizedOracle.setResult({
          contractAddress: tx.oracleAddress,
          resultIndex: tx.optionIdx,
          senderAddress: tx.senderAddress,
        });
        txid = setResultTx.txid;
      } catch (err) {
        logger.error(`Error calling CentralizedOracle.setResult: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        _id: txid,
        txid,
        version: tx.version,
        type: 'SETRESULT',
        status: Constants.PENDING,
        senderAddress: tx.senderAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
        createdTime: moment().unix(),
      });
      break;
    }

    // Approve was reset to 0. Sending approve for vote amount.
    case 'RESETAPPROVEVOTE': {
      try {
        const approveTx = await bodhiToken.approve({
          spender: tx.topicAddress,
          value: tx.amount,
          senderAddress: tx.senderAddress,
        });
        txid = approveTx.txid;
      } catch (err) {
        logger.error(`Error calling BodhiToken.approve: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        _id: txid,
        txid,
        version: tx.version,
        type: 'APPROVEVOTE',
        status: Constants.PENDING,
        senderAddress: tx.senderAddress,
        topicAddress: tx.topicAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount,
        createdTime: moment().unix(),
      });
      break;
    }

    // Approve was accepted. Sending vote.
    case 'APPROVEVOTE': {
      try {
        const voteTx = await decentralizedOracle.vote({
          contractAddress: tx.oracleAddress,
          resultIndex: tx.optionIdx,
          botAmount: tx.amount,
          senderAddress: tx.senderAddress,
        });
        txid = voteTx.txid;
      } catch (err) {
        logger.error(`Error calling DecentralizedOracle.vote: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        _id: txid,
        txid,
        version: tx.version,
        type: 'VOTE',
        status: Constants.PENDING,
        senderAddress: tx.senderAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
        createdTime: moment().unix(),
      });
      break;
    }

    default: {
      break;
    }
  }
}

module.exports = updatePendingTxs;
