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
  static async insertTopic(db, topic) {
    try {
      await db.insert(topic);
    } catch (err) {
      logger.error(`Error insert Topic ${topic}: ${err.message}`);
    }
  }

  static async updateTopicByQuery(db, topic, query) {
    try {
      await db.update(
        query,
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
            creatorAddress: topic.creatorAddress,
          },
        },
        {},
      );
    } catch (err) {
      logger.error(`Error update Topic by query:${query}: ${err.message}`);
    }
  }

  static async removeTopicsByQuery(topicDb, query) {
    try {
      const numRemoved = await topicDb.remove(query, { multi: true });
      logger.debug(`Remove: ${numRemoved} Topic query:${query}`);
    } catch (err) {
      logger.error(`Remove Topics by query:${query}: ${err.message}`);
    }
  }

  static async insertOracle(db, oracle) {
    try {
      await db.insert(oracle);
    } catch (err) {
      logger.error(`Error insert COracle:${oracle}: ${err.message}`);
    }
  }

  static async updateOracleByQuery(db, oracle, query) {
    try {
      await db.update(
        query,
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
        {},
      );
    } catch (err) {
      logger.error(`Error update Oracle by query:${query}: ${err.message}`);
    }
  }

  static async removeOraclesByQuery(oracleDb, query) {
    try {
      const numRemoved = await oracleDb.remove(query, { multi: true });
      logger.debug(`Remove: ${numRemoved} Oracle by query:${query}`);
    } catch (err) {
      logger.error(`Remove Oracles by query:${query}: ${err.message}`);
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

  static async isPreviousCreateEventPending(txDb, senderAddress) {
    try {
      return await txDb.count({
        type: { $in: ['APPROVECREATEEVENT', 'CREATEEVENT'] },
        status: 'PENDING',
        senderAddress,
      });
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
