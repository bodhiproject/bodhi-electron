const _ = require('lodash');
const moment = require('moment');

const logger = require('../utils/logger');
const blockchain = require('../api/blockchain');
const bodhiToken = require('../api/bodhi_token');
const eventFactory = require('../api/event_factory');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/nedb').DBHelper;

const { txState } = require('../constants');

async function updatePendingTxs(db) {
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
      logger.error(`Error: Update Transaction ${tx.type} txid:${tx._id}: ${err.message}`);
      throw err;
    }
  }
}

// Execute follow-up transaction for successful txs
async function onSuccessfulTx(tx, db) {
  const Transactions = db.Transactions;
  let txid;

  switch (tx.type) {
    // Approve was accepted. Sending createEvent.
    case 'APPROVECREATEEVENT': {
      try {
        const createTopicTx = await eventFactory.createTopic({
          oracleAddress: tx.resultSetterAddress,
          eventName: tx.name,
          resultNames: tx.options,
          bettingStartTime: tx.bettingStartTime,
          bettingEndTime: tx.bettingEndTime,
          resultSettingStartTime: tx.resultSettingStartTime,
          resultSettingEndTime: tx.resultSettingEndTime,
          senderAddress: tx.senderAddress,
        });
        txid = createTopicTx.txid;
      } catch (err) {
        logger.error(`Error calling EventFactory.createTopic: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
        _id: txid,
        txid,
        version: tx.version,
        type: 'CREATEEVENT',
        status: txState.PENDING,
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
        status: txState.PENDING,
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
        status: txState.PENDING,
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

    default: {
      break;
    }
  }
}

// Execute follow-up transaction for failed txs
async function onFailedTx(tx, db) {
  const Transactions = db.Transactions;
  let txid;

  switch (tx.type) {
    // Approve failed. Reset allowance.
    case 'APPROVESETRESULT':
    case 'APPROVEVOTE': {
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
        type: 'RESETAPPROVE',
        status: txState.PENDING,
        createdTime: moment().unix(),
        version: tx.version,
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

module.exports = updatePendingTxs;
