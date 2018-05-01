const _ = require('lodash');
const moment = require('moment');

const logger = require('../utils/logger');
const blockchain = require('../api/blockchain');
const wallet = require('../api/wallet');
const bodhiToken = require('../api/bodhi_token');
const eventFactory = require('../api/event_factory');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/nedb').DBHelper;
const { Config, getContractMetadata } = require('../config/config');
const { txState } = require('../constants');
const Utils = require('../utils/utils');

async function updatePendingTxs(db, currentBlockCount) {
  let pendingTxs;
  try {
    pendingTxs = await db.Transactions.cfind({ status: txState.PENDING })
      .sort({ createdTime: -1 }).exec();
  } catch (err) {
    logger.error(`Error: get pending Transactions: ${err.message}`);
    throw err;
  }

  // TODO(frank): batch to void too many rpc calls
  const updatePromises = [];
  _.each(pendingTxs, (tx) => {
    updatePromises.push(new Promise(async (resolve) => {
      await updateTx(tx, currentBlockCount);
      await updateDB(tx, db);
      resolve();
    }));
  });
  await Promise.all(updatePromises);
}

// Update the Transaction info
async function updateTx(tx, currentBlockCount) {
  // sendtoaddress does not use the same confirmation method as EVM txs
  if (tx.type === 'TRANSFER' && tx.token === 'QTUM' && !tx.blockNum) {
    const txInfo = await wallet.getTransaction({ txid: tx.txid });

    if (txInfo.confirmations > 0) {
      tx.status = txState.SUCCESS;
      tx.gasUsed = Math.floor(Math.abs(txInfo.fee) / Config.DEFAULT_GAS_PRICE);

      tx.blockNum = currentBlockCount - txInfo.confirmations + 1;
      const blockHash = await blockchain.getBlockHash({ blockNum: tx.blockNum });
      const blockInfo = await blockchain.getBlock({ blockHash });
      tx.blockTime = blockInfo.time;
    }
    return;
  }

  // Update tx status based on EVM tx logs
  const resp = await blockchain.getTransactionReceipt({ transactionId: tx.txid });

  if (_.isEmpty(resp)) {
    tx.status = txState.PENDING;
  } else {
    const blockInfo = await blockchain.getBlock({ blockHash: resp[0].blockHash });

    tx.status = _.isEmpty(resp[0].log) ? txState.FAIL : txState.SUCCESS;
    tx.gasUsed = resp[0].gasUsed;
    tx.blockNum = resp[0].blockNumber;
    tx.blockTime = blockInfo.time;
  }
}

// Update the DB with new Transaction info
async function updateDB(tx, db) {
  if (tx.status !== txState.PENDING) {
    try {
      logger.debug(`Update: ${tx.status} Transaction ${tx.type} txid:${tx.txid}`);
      const updateRes = await db.Transactions.update(
        { txid: tx.txid },
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
          case txState.SUCCESS: {
            await onSuccessfulTx(updatedTx, db);
            break;
          }
          case txState.FAIL: {
            await onFailedTx(updatedTx, db);
            break;
          }
          default: {
            break;
          }
        }
      }
    } catch (err) {
      logger.error(`Error: Update Transaction ${tx.type} txid:${tx.txid}: ${err.message}`);
      throw err;
    }
  }
}

// Execute follow-up transaction for successful txs
async function onSuccessfulTx(tx, db) {
  const { Oracles, Transactions } = db;
  let sentTx;

  switch (tx.type) {
    // Approve was accepted. Sending createEvent.
    case 'APPROVECREATEEVENT': {
      try {
        sentTx = await eventFactory.createTopic({
          oracleAddress: tx.resultSetterAddress,
          eventName: tx.name,
          resultNames: tx.options,
          bettingStartTime: tx.bettingStartTime,
          bettingEndTime: tx.bettingEndTime,
          resultSettingStartTime: tx.resultSettingStartTime,
          resultSettingEndTime: tx.resultSettingEndTime,
          senderAddress: tx.senderAddress,
        });
      } catch (err) {
        logger.error(`Error calling EventFactory.createTopic: ${err.message}`);
        throw err;
      }

      // Update Topic's approve txid with the createTopic txid
      await DBHelper.updateObjectByQuery(db.Topics, { txid: tx.txid }, { txid: sentTx.txid });

      // Update Oracle's approve txid with the createTopic txid
      await DBHelper.updateObjectByQuery(db.Oracles, { txid: tx.txid }, { txid: sentTx.txid });

      await DBHelper.insertTransaction(Transactions, {
        txid: sentTx.txid,
        version: tx.version,
        type: 'CREATEEVENT',
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress: tx.senderAddress,
        name: tx.name,
        options: tx.options,
        resultSetterAddress: tx.resultSetterAddress,
        bettingStartTime: tx.bettingStartTime,
        bettingEndTime: tx.bettingEndTime,
        resultSettingStartTime: tx.resultSettingStartTime,
        resultSettingEndTime: tx.resultSettingEndTime,
        amount: tx.amount,
        token: tx.token,
      });
      break;
    }

    // Approve was accepted. Sending setResult.
    case 'APPROVESETRESULT': {
      try {
        sentTx = await centralizedOracle.setResult({
          contractAddress: tx.oracleAddress,
          resultIndex: tx.optionIdx,
          senderAddress: tx.senderAddress,
        });
      } catch (err) {
        logger.error(`Error calling CentralizedOracle.setResult: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        txid: sentTx.txid,
        version: tx.version,
        type: 'SETRESULT',
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress: tx.senderAddress,
        topicAddress: tx.topicAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
      });
      break;
    }

    // Approve was accepted. Sending vote.
    case 'APPROVEVOTE': {
      try {
        // Find if voting over threshold to set correct gas limit
        const gasLimit = await Utils.getVotingGasLimit(Oracles, tx.oracleAddress, tx.optionIdx, tx.amount);

        sentTx = await decentralizedOracle.vote({
          contractAddress: tx.oracleAddress,
          resultIndex: tx.optionIdx,
          botAmount: tx.amount,
          senderAddress: tx.senderAddress,
          gasLimit,
        });
      } catch (err) {
        logger.error(`Error calling DecentralizedOracle.vote: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        txid: sentTx.txid,
        version: tx.version,
        type: 'VOTE',
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress: tx.senderAddress,
        topicAddress: tx.topicAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
      });
      break;
    }

    default: {
      break;
    }
  }
}

// Execute follow-up transaction for failed txs
async function onFailedTx(tx, db) {
  switch (tx.type) {
    // Approve failed. Reset allowance and delete created Topic/COracle.
    case 'APPROVECREATEEVENT': {
      resetApproveAmount(db, tx, getContractMetadata().AddressManager.address);
      removeCreatedTopicAndOracle(db, tx);
      break;
    }

    // CreateTopic failed. Delete created Topic/COracle.
    case 'CREATEEVENT': {
      removeCreatedTopicAndOracle(db, tx);
      break;
    }

    // Approve failed. Reset allowance.
    case 'APPROVESETRESULT':
    case 'APPROVEVOTE': {
      resetApproveAmount(db, tx, tx.topicAddress);
      break;
    }

    default: {
      break;
    }
  }
}

// Failed approve tx so call approve for 0.
async function resetApproveAmount(db, tx, spender) {
  let sentTx;
  try {
    sentTx = await bodhiToken.approve({
      spender,
      value: 0,
      senderAddress: tx.senderAddress,
    });
  } catch (err) {
    logger.error(`Error calling BodhiToken.approve: ${err.message}`);
    throw err;
  }

  await DBHelper.insertTransaction(db.Transactions, {
    txid: sentTx.txid,
    type: 'RESETAPPROVE',
    status: txState.PENDING,
    gasLimit: sentTx.args.gasLimit.toString(10),
    gasPrice: sentTx.args.gasPrice.toFixed(8),
    createdTime: moment().unix(),
    version: tx.version,
    senderAddress: tx.senderAddress,
    topicAddress: tx.topicAddress,
    oracleAddress: tx.oracleAddress,
    name: tx.name,
  });
}

// Remove created Topic/COracle because tx failed
async function removeCreatedTopicAndOracle(db, tx) {
  await DBHelper.removeTopicsByQuery(db.Topics, { txid: tx.txid });
  await DBHelper.removeOraclesByQuery(db.Oracles, { txid: tx.txid });
}

module.exports = updatePendingTxs;
