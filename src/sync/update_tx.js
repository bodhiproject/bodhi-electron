const _ = require('lodash');
const { Qweb3 } = require('qweb3');
const fetch = require('node-fetch');

const config = require('../config/config');
const logger = require('../utils/logger');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/db_helper');

const qclient = new Qweb3(config.QTUM_RPC_ADDRESS);

async function checkTxStatus(txid) {
  const resp = await qclient.getTransactionReceipt(txid);
  console.log(resp);
  if (_.isEmpty(resp)) {
    return {
      status: 'PENDING',
    };
  }

  const tx = resp[0];
  if (_.isEmpty(tx.log)) {
    return {
      status: 'FAIL',
      gasUsed: tx.gasUsed,
      blockNum: tx.blockNum,
    };
  }

  return {
    status: 'SUCCESS',
    gasUsed: tx.gasUsed,
    blockNum: tx.blockNum,
  };
}

async function updateTxDB(db) {
  let pendingTxs;
  try {
    pendingTxs = await db.Transactions.cfind({ status: 'PENDING' })
      .sort({ createTime: -1 }).exec();
  } catch (err) {
    logger.error(`Error updateTxDB: ${err.message}`);
    throw err;
  }

  // TODO(frank): batch to void too many rpc calls
  await Promise.all(pendingTxs.map(async (txid) => {
    await updateTx(txid, db);
  }));
}

async function updateTx(approveTxid, db) {
  const txReceipt = await checkTxStatus(approveTxid);
  let tx;
  if (txReceipt.status !== 'PENDING') {
    try {
      tx = await db.Transactions.update(
        { address: approveTxid },
        {
          $set: {
            status: txReceipt.status,
            gasUsed: txReceipt.gasUsed,
            blockNum: txReceipt.blockNum,
          },
        }, 
        {},
      );
    } catch (err) {
      logger.error(`Error updateApproveTx ${approveTxid}: ${err.message}`);
      throw err;
    }
  }

  if (txReceipt.status === 'SUCCESS' && tx.type.startsWith('APPROVE')) {
    updateApprovedTx(tx, db);
  }
}

async function updateApprovedTx(approveTx, db) {
  const Transactions = db.Transactions;
  if (approveTx.type === 'APPROVESETRESULT') {
    let setResultTxid;
    try {
      const tx = await centralizedOracle.setResult({
        contractAddress: approveTx.entityId,
        resultIndex: approveTx.optionIdx,
        senderAddress: approveTx.senderAddress,
      });
      setResultTxid = tx.result.txid;
    } catch (err) {
      logger.error(`Error calling /set-result: ${err.message}`);
      throw err;
    }

    const tx = {
      _id: setResultTxid,
      version: approveTx.version,
      type: 'SETRESULT',
      status: 'PENDING',
      senderAddress: approveTx.senderAddress,
      entityId: approveTx.entityId,
      optionIdx: approveTx.optionIdx,
      token: 'BOT',
      amount: approveTx.amount,
      createdTime: Date.now().toString(),
    };
    await DBHelper.insertTransaction(Transactions, tx);
  } else if (approveTx.type === 'APPROVEVOTE') {
    let voteTxid;
    try {
      const tx = await decentralizedOracle.vote({
        contractAddress: approveTx.entityId,
        resultIndex: approveTx.optionIdx,
        botAmount: approveTx.amount,
        senderAddress: approveTx.senderAddress,
      });
      voteTxid = tx.result.txid;
    } catch (err) {
      logger.error(`Error calling /vote: ${err.message}`);
      throw err;
    }

    const tx = {
      _id: voteTxid,
      version: approveTx.version,
      type: 'VOTE',
      txStatus: 'PENDING',
      senderAddress: approveTx.senderAddress,
      entityId: approveTx.entityId,
      optionIdx: approveTx.optionIdx,
      token: 'BOT',
      amount: approveTx.approveTx.amount,
      createdTime: Date.now().toString(),
    };
    await DBHelper.insertTransaction(Transactions, tx);
  }
}

module.exports = updateTxDB;
