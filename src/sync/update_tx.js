const _ = require('lodash');

const logger = require('../utils/logger');
const blockchain = require('../api/blockchain');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/db_helper');

async function updatePendingTxs(db) {
  let pendingTxs;
  try {
    pendingTxs = await db.Transactions.cfind({ status: 'PENDING' })
      .sort({ createTime: -1 }).exec();
  } catch (err) {
    logger.error(`Error getting pending Transactions: ${err.message}`);
    throw err;
  }

  // TODO(frank): batch to void too many rpc calls
  const updatePromises = [];
  _.each(pendingTxs, (tx) => {
    updatePromises.push(new Promise(async (resolve) => {
      await updateTx(tx);
      await updateDB(tx, db);
      await executeFollowUpTx(tx, db);
      resolve();
    }));
  })
  await Promise.all(updatePromises);
}

// Update the Transaction info
async function updateTx(tx) {
  const resp = await blockchain.getTransactionReceipt({ transactionId: tx._id });

  if (_.isEmpty(resp)) {
    tx.status = 'PENDING';
  } else if (_.isEmpty(resp[0].log)) {
    tx.status = 'FAIL';
    tx.gasUsed = resp[0].gasUsed;
    tx.blockNum = resp[0].blockNumber;
  } else {
    tx.status = 'SUCCESS';
    tx.gasUsed = resp[0].gasUsed;
    tx.blockNum = resp[0].blockNumber;
  }
}

// Update the DB with new Transaction info
async function updateDB(tx, db) {
  if (tx.status !== 'PENDING') {
    try {
      logger.debug(`Updating Transaction ${tx.type} ${tx._id}`);
      await db.Transactions.update(
        { _id: tx._id },
        {
          $set: {
            status: tx.status,
            gasUsed: tx.gasUsed,
            blockNum: tx.blockNum,
          },
        }, 
        {},
      );
    } catch (err) {
      logger.error(`Error updating Transaction ${tx.type} ${tx._id}: ${err.message}`);
      throw err;
    }
  }
}

// Execute follow-up transaction
async function executeFollowUpTx(tx, db) {
  if (tx.status !== 'SUCCESS') {
    return;
  }

  const Transactions = db.Transactions;
  let txid;
  switch (tx.type) {
    case 'APPROVESETRESULT': {
      try {
        const setResultTx = await centralizedOracle.setResult({
          contractAddress: tx.oracleAddress,
          resultIndex: tx.optionIdx,
          senderAddress: tx.senderAddress,
        });
        txid = setResultTx.txid;
      } catch (err) {
        logger.error(`Error calling /set-result: ${err.message}`);
        throw err;
      }

      const tx = {
        _id: txid,
        txid,
        version: tx.version,
        type: 'SETRESULT',
        status: 'PENDING',
        senderAddress: tx.senderAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
        createdTime: Date.now().toString(),
      };
      await DBHelper.insertTransaction(Transactions, tx);
      break;
    }
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
        logger.error(`Error calling /vote: ${err.message}`);
        throw err;
      }

      const tx = {
        _id: txid,
        txid,
        version: tx.version,
        type: 'VOTE',
        status: 'PENDING',
        senderAddress: tx.senderAddress,
        oracleAddress: tx.oracleAddress,
        optionIdx: tx.optionIdx,
        token: 'BOT',
        amount: tx.amount,
        createdTime: Date.now().toString(),
      };
      await DBHelper.insertTransaction(Transactions, tx);
      break;
    }
    default: {
      break;
    }
  }
}

module.exports = updatePendingTxs;
