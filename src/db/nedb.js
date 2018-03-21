const path = require('path');
const datastore = require('nedb-promise');
const _ = require('lodash');

const Utils = require('../utils/utils');
const logger = require('../utils/logger');

const basePath = `${Utils.getDataDir()}/nedb`;
const topics = datastore({ filename: `${basePath}/topics.db`, autoload: true });
const oracles = datastore({ filename: `${basePath}/oracles.db`, autoload: true });
const votes = datastore({ filename: `${basePath}/votes.db`, autoload: true });
const blocks = datastore({ filename: `${basePath}/blocks.db`, autoload: true });
const transactions = datastore({ filename: `${basePath}/transactions.db`, autoload: true });

const dbPromises = [topics, oracles, votes, blocks, transactions];

async function connectDB() {
  try {
    await Promise.all(dbPromises);
  } catch (err) {
    console.error(`DB load Error: ${err.message}`);
    return;
  }

  return {
    Topics: topics,
    Oracles: oracles,
    Votes: votes,
    Blocks: blocks,
    Transactions: transactions,
  };
}

class DBHelper {
  static async insertOrUpdateTopic(db, topic, queryTxid) {
    try {
      let txid = topic.txid;
      if (!_.isEmpty(queryTxid)) {
        txid = queryTxid;
      }

      await db.update(
        { txid },
        {
          $set: {
            txid: topic.txid,
            blockNum: topic.blockNum,
            status: topic.status,
            version: topic.version,
            address: topic.address,
            name: topic.name,
            options: topic.options,
            qtumAmount: topic.qtumAmount,
            botAmount: topic.botAmount,
            resultIdx: topic.resultIdx,
          },
        },
        { upsert: true },
      );
    } catch (err) {
      logger.error(`Error upserting Topic txid:${topic.txid}: ${err.message}`);
    }
  }

  static async removeTopic(db, txid) {
    try {
      const numRemoved = await db.remove({ txid }, {});
      logger.debug(`Remove: ${numRemoved} Topic txid:${txid}`);
    } catch (err) {
      logger.error(`Remove: Topic txid:${txid}: ${err.message}`);
    }
  }

  static async insertOrUpdateCOracle(db, oracle, queryTxid) {
    try {
      let txid = oracle.txid;
      if (!_.isEmpty(queryTxid)) {
        txid = queryTxid;
      }

      await db.update(
        { txid },
        {
          $set: {
            txid: oracle.txid,
            blockNum: oracle.blockNum,
            status: oracle.status,
            version: oracle.version,
            address: oracle.address,
            topicAddress: oracle.topicAddress,
            resultSetterAddress: oracle.resultSetterAddress,
            resultSetterQAddress: oracle.resultSetterQAddress,
            token: oracle.token,
            name: oracle.name,
            options: oracle.options,
            optionIdxs: oracle.optionIdxs,
            amounts: oracle.amounts,
            resultIdx: oracle.resultIdx,
            startTime: oracle.startTime,
            endTime: oracle.endTime,
            resultSetStartTime: oracle.resultSetStartTime,
            resultSetEndTime: oracle.resultSetEndTime,
            consensusThreshold: oracle.consensusThreshold,
          },
        },
        { upsert: true },
      );
    } catch (err) {
      logger.error(`Error upserting COracle txid:${oracle.txid}: ${err.message}`);
    }
  }

  static async removeOracle(db, txid) {
    try {
      const numRemoved = await db.remove({ txid }, {});
      logger.debug(`Remove: ${numRemoved} Oracle txid:${txid}`);
    } catch (err) {
      logger.error(`Remove: Oracle txid:${txid}: ${err.message}`);
    }
  }

  static async insertTransaction(db, tx) {
    try {
      logger.debug(`Mutation Insert: Transaction ${tx.type} txid:${tx.txid}`);
      await db.insert(tx);
    } catch (err) {
      logger.error(`Error inserting Transaction ${tx.type} ${tx.txid}: ${err.message}`);
      throw err;
    }
  }

  static async isPreviousCreateEventPending(db) {
    try {
      const approve = await db.count({ type: 'APPROVECREATEEVENT', status: 'PENDING' });
      const createEvent = await db.count({ type: 'CREATEEVENT', status: 'PENDING' });
      return approve > 0 || createEvent > 0;
    } catch (err) {
      logger.error(`Checking CreateEvent pending: ${err.message}`);
      throw err;
    }
  }
}

module.exports = {
  connectDB,
  DBHelper,
};
