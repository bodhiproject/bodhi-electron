const datastore = require('nedb-promise');
const _ = require('lodash');

const Utils = require('../utils/utils');
const { getLogger } = require('../utils/logger');
const migrateTxDB = require('./migrations/migrateTx');

const db = {
  Topics: undefined,
  Oracles: undefined,
  Votes: undefined,
  Blocks: undefined,
  Transactions: undefined,
};

// Init datastores
async function initDB() {
  try {
    await migrateDB();
  } catch (err) {
    throw new Error(`DB Migration Error: ${err.message}`);
  }

  const blockchainDataPath = Utils.getDataDir();
  const localCacheDataPath = Utils.getLocalCacheDataDir();
  getLogger().info(`Blockchain data path: ${blockchainDataPath}`);
  getLogger().info(`Local cache data path: ${localCacheDataPath}`);

  db.Topics = datastore({ filename: `${blockchainDataPath}/topics.db` });
  db.Oracles = datastore({ filename: `${blockchainDataPath}/oracles.db` });
  db.Votes = datastore({ filename: `${blockchainDataPath}/votes.db` });
  db.Blocks = datastore({ filename: `${blockchainDataPath}/blocks.db` });
  db.Transactions = datastore({ filename: `${localCacheDataPath}/transactions.db` });

  try {
    await Promise.all([
      db.Topics.loadDatabase(),
      db.Oracles.loadDatabase(),
      db.Votes.loadDatabase(),
      db.Blocks.loadDatabase(),
      db.Transactions.loadDatabase(),
    ]);

    await db.Topics.ensureIndex({ fieldName: 'txid', unique: true });
    await db.Oracles.ensureIndex({ fieldName: 'txid', unique: true });
    await db.Votes.ensureIndex({ fieldName: 'txid', unique: true });
  } catch (err) {
    throw new Error(`DB load Error: ${err.message}`);
  }
}

// Migrate DB
async function migrateDB() {
  // check migration script in migration folder
  await migrateTxDB();
}

class DBHelper {
  static async getCount(db, query) {
    try {
      return await db.count(query);
    } catch (err) {
      getLogger().error(`Error getting DB count. db:${db} err:${err.message}`);
    }
  }

  /*
  * Returns the fields of the object in one of the tables searched by the query.
  * @param db The DB table.
  * @param query {Object} The query by items.
  * @param fields {Array} The fields to return for the found item in an array.
  */
  static async findOne(db, query, fields) {
    let fieldsObj;
    if (!_.isEmpty(fields)) {
      fieldsObj = {};
      _.each(fields, (field) => fieldsObj[field] = 1);
    }

    const found = await db.findOne(query, fieldsObj);
    if (!found) {
      const { filename } = db.nedb;
      throw Error(`Could not findOne ${filename.substr(filename.lastIndexOf('/') + 1)} by query ${JSON.stringify(query)}`);
    }
    return found;
  }

  static async insertTopic(db, topic) {
    try {
      await db.insert(topic);
    } catch (err) {
      getLogger().error(`Error insert Topic ${topic}: ${err.message}`);
    }
  }

  static async updateObjectByQuery(db, query, update) {
    try {
      await db.update(query, { $set: update }, {});
    } catch (err) {
      getLogger().error(`Error update ${update} object by query:${query}: ${err.message}`);
    }
  }

  static async updateTopicByQuery(db, query, topic) {
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
      getLogger().error(`Error update Topic by query:${query}: ${err.message}`);
    }
  }

  static async removeTopicsByQuery(topicDb, query) {
    try {
      const numRemoved = await topicDb.remove(query, { multi: true });
      getLogger().debug(`Remove: ${numRemoved} Topic query:${query}`);
    } catch (err) {
      getLogger().error(`Remove Topics by query:${query}: ${err.message}`);
    }
  }

  static async insertOracle(db, oracle) {
    try {
      await db.insert(oracle);
    } catch (err) {
      getLogger().error(`Error insert COracle:${oracle}: ${err.message}`);
    }
  }

  static async updateOracleByQuery(db, query, oracle) {
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
      getLogger().error(`Error update Oracle by query:${query}: ${err.message}`);
    }
  }

  static async removeOraclesByQuery(oracleDb, query) {
    try {
      const numRemoved = await oracleDb.remove(query, { multi: true });
      getLogger().debug(`Remove: ${numRemoved} Oracle by query:${query}`);
    } catch (err) {
      getLogger().error(`Remove Oracles by query:${query}: ${err.message}`);
    }
  }

  static async insertTransaction(db, tx) {
    try {
      getLogger().debug(`Mutation Insert: Transaction ${tx.type} txid:${tx.txid}`);
      await db.insert(tx);
    } catch (err) {
      getLogger().error(`Error inserting Transaction ${tx.type} ${tx.txid}: ${err.message}`);
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
      getLogger().error(`Checking CreateEvent pending: ${err.message}`);
      throw err;
    }
  }
}

module.exports = {
  db,
  initDB,
  DBHelper,
};
