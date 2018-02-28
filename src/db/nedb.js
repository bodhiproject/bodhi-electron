const path = require('path');
const datastore = require('nedb-promise');

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
      logger.error(`Error inserting Topic ${topic.txid}: ${err.message}`);
      throw err;
    }
  }

  static async insertOracle(db, oracle) {
    try {
      await db.insert(oracle);
    } catch (err) {
      logger.error(`Error inserting Oracle ${oracle.txid}: ${err.message}`);
      throw err;
    }
  }

  static async insertTransaction(db, tx) {
    try {
      await db.insert(tx);
    } catch (err) {
      logger.error(`Error inserting Transaction ${tx.type} ${tx.txid}: ${err.message}`);
      throw err;
    }
  }
}

module.exports = {
  connectDB,
  DBHelper
};
