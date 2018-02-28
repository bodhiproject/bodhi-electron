const _ = require('lodash');

const logger = require('../utils/logger');
const blockchain = require('../api/blockchain');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/nedb').DBHelper;

async function updatePendingTxs(db) {
  let pendingTxs;
  try {
    pendingTxs = await db.Transactions.cfind({ status: 'PENDING' })
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
  })
  await Promise.all(updatePromises);
}

// If current allowance != 0 when trying to approve, the transaction will fail
// Need to reset the allowance to 0, by calling approve with value: 0
async function resetAllowance(tx) {

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
      if (updatedTx && updatedTx.status === 'SUCCESS') {
        await executeFollowUpTx(updatedTx, db);
      }
    } catch (err) {
      logger.error(`Error: Update Transaction ${tx.type} txid:${tx._id}: ${err.message}`);
      throw err;
    }
  }
}

// Execute follow-up transaction
async function executeFollowUpTx(tx, db) {
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
        logger.error(`Error calling CentralizedOracle.setResult: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
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
      });
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
        logger.error(`Error calling DecentralizedOracle.vote: ${err.message}`);
        throw err;
      }

      await DBHelper.insertTransaction(Transactions, {
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
      });
      break;
    }
    default: {
      break;
    }
  }
}

module.exports = updatePendingTxs;
