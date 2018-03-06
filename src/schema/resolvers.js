/* eslint no-underscore-dangle: [2, { "allow": ["_id"] }] */

const _ = require('lodash');
const fetch = require('node-fetch');
const Web3Utils = require('web3-utils');
const moment = require('moment');

const pubsub = require('../pubsub');
const logger = require('../utils/logger');
const bodhiToken = require('../api/bodhi_token');
const eventFactory = require('../api/event_factory');
const topicEvent = require('../api/topic_event');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const DBHelper = require('../db/nedb').DBHelper;

const DEFAULT_LIMIT_NUM = 50;
const DEFAULT_SKIP_NUM = 0;

function buildCursorOptions(cursor, orderBy, limit, skip) {
  if (!_.isEmpty(orderBy)) {
    const sortDict = {};
    _.forEach(orderBy, (order) => {
      sortDict[order.field] = order.direction === 'ASC' ? 1 : -1;
    });

    cursor.sort(sortDict);
  }

  cursor.limit(limit || DEFAULT_LIMIT_NUM);
  cursor.skip(skip || DEFAULT_SKIP_NUM);

  return cursor;
}

function buildTopicFilters({ OR = [], address, status }) {
  const filter = (address || status) ? {} : null;
  if (address) {
    filter._id = address;
  }

  if (status) {
    filter.status = status;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildTopicFilters(OR[i]));
  }
  return filters;
}

function buildOracleFilters({
  OR = [], address, topicAddress, resultSetterQAddress, status, token,
}) {
  const filter = (address || topicAddress || resultSetterQAddress || status || token) ? {} : null;
  if (address) {
    filter._id = address;
  }

  if (topicAddress) {
    filter.topicAddress = topicAddress;
  }

  if (resultSetterQAddress) {
    filter.resultSetterQAddress = resultSetterQAddress;
  }

  if (status) {
    filter.status = status;
  }

  if (token) {
    filter.token = token;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildOracleFilters(OR[i]));
  }

  return filters;
}

function buildSearchOracleFilter(searchPhrase) {
  const filterFields = ['name', '_id', 'topicAddress', 'resultSetterAddress', 'resultSetterQAddress'];
  if (!searchPhrase) {
    return [];
  }

  const filters = [];
  const searchRegex = new RegExp(`.*${searchPhrase}.*`);
  for (let i = 0; i < filterFields.length; i++) {
    const filter = {};
    filter[filterFields[i]] = { $regex: searchRegex };
    filters.push(filter);
  }

  return filters;
}

function buildVoteFilters({
  OR = [], oracleAddress, voterAddress, voterQAddress, optionIdx,
}) {
  const filter = (oracleAddress || voterAddress || voterQAddress || optionIdx) ? {} : null;

  if (oracleAddress) {
    filter.oracleAddress = oracleAddress;
  }

  if (voterAddress) {
    filter.voterAddress = voterAddress;
  }

  if (voterQAddress) {
    filter.voterQAddress = voterQAddress;
  }

  if (optionIdx) {
    filter.optionIdx = optionIdx;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildVoteFilters(OR[i]));
  }
  return filters;
}

function buildTransactionFilters({
  OR = [], type, status, topicAddress, oracleAddress, senderAddress, senderQAddress,
}) {
  const filter = (type || status || topicAddress || oracleAddress || senderAddress || senderQAddress) ? {} : null;

  if (type) {
    filter.type = type;
  }

  if (status) {
    filter.status = status;
  }

  if (topicAddress) {
    filter.topicAddress = topicAddress;
  }

  if (oracleAddress) {
    filter.oracleAddress = oracleAddress;
  }

  if (senderAddress) {
    filter.senderAddress = senderAddress;
  }

  if (senderQAddress) {
    filter.senderQAddress = senderQAddress;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildTransactionFilters(OR[i]));
  }
  return filters;
}

async function isAllowanceEnough(owner, spender, amount) {
  try {
    const res = await bodhiToken.allowance({
      owner,
      spender,
      senderAddress: owner,
    });

    const allowance = Web3Utils.toBN(res.remaining);
    const amountBN = Web3Utils.toBN(amount);
    return allowance.gte(amountBN);
  } catch (err) {
    logger.error(`Error checking allowance: ${err.message}`);
    throw err;
  }
}

module.exports = {
  Query: {
    allTopics: async (root, {
      filter, orderBy, limit, skip,
    }, { db: { Topics } }) => {
      const query = filter ? { $or: buildTopicFilters(filter) } : {};
      let cursor = Topics.cfind(query);
      cursor = buildCursorOptions(cursor, orderBy, limit, skip);

      return cursor.exec();
    },

    allOracles: async (root, {
      filter, orderBy, limit, skip,
    }, { db: { Oracles } }) => {
      const query = filter ? { $or: buildOracleFilters(filter) } : {};
      let cursor = Oracles.cfind(query);
      cursor = buildCursorOptions(cursor, orderBy, limit, skip);
      return cursor.exec();
    },

    searchOracles: async (root, {
      searchPhrase, orderBy, limit, skip,
    }, { db: { Oracles } }) => {
      const query = searchPhrase ? { $or: buildSearchOracleFilter(searchPhrase) } : {};
      let cursor = Oracles.cfind(query);
      cursor = buildCursorOptions(cursor, orderBy, limit, skip);
      return cursor.exec();
    },

    allVotes: async (root, {
      filter, orderBy, limit, skip,
    }, { db: { Votes } }) => {
      const query = filter ? { $or: buildVoteFilters(filter) } : {};
      let cursor = Votes.cfind(query);
      cursor = buildCursorOptions(cursor, orderBy, limit, skip);
      return cursor.exec();
    },

    allTransactions: async(root, {
      filter, orderBy, limit, skip,
    }, { db: { Transactions } }) => {
      const query = filter ? { $or: buildTransactionFilters(filter) } : {};
      let cursor = Transactions.cfind(query);
      cursor = buildCursorOptions(cursor, orderBy, limit, skip);
      return cursor.exec();
    },

    syncInfo: async (root, {}, { db: { Blocks } }) => {
      let syncBlockNum = null;
      let syncBlockTime = null;
      let blocks;
      try {
        blocks = await Blocks.cfind({}).sort({ blockNum: -1 }).limit(1).exec();
      } catch (err) {
        logger.error(`Error query latest block from db: ${err.message}`);
      }

      if (blocks.length > 0) {
        syncBlockNum = blocks[0].blockNum;
        syncBlockTime = blocks[0].blockTime;
      }

      let chainBlockNum = null;
      try {
        const resp = await fetch('https://testnet.qtum.org/insight-api/status?q=getInfo');
        const json = await resp.json();
        chainBlockNum = json.info.blocks;
      } catch (err) {
        logger.error(`Error GET https://testnet.qtum.org/insight-api/status?q=getInfo: ${err.message}`);
      }

      return { syncBlockNum, syncBlockTime, chainBlockNum };
    },
  },

  Mutation: {
    createTopic: async (root, data, { db: { Topics, Oracles, Transactions } }) => {
      const {
        name,
        options,
        resultSetterAddress,
        bettingStartTime,
        bettingEndTime,
        resultSettingStartTime,
        resultSettingEndTime,
        senderAddress,
      } = data;

      // Send createTopic tx
      let txid;
      try {
        const tx = await eventFactory.createTopic({
          oracleAddress: resultSetterAddress,
          eventName: name,
          resultNames: options,
          bettingStartTime,
          bettingEndTime,
          resultSettingStartTime,
          resultSettingEndTime,
          senderAddress,
        });
        txid = tx.txid;
      } catch (err) {
        logger.error(`Error calling EventFactory.createTopic: ${err.message}`);
        throw err;
      }

      // Fetch version number
      let version;
      try {
        const res = await eventFactory.version({ senderAddress });
        version = Number(res[0]);
      } catch (err) {
        logger.error(`Error calling EventFactory.version: ${err.message}`);
        throw err;
      }

      // Insert Topic
      const topic = {
        _id: txid,
        txid,
        version,
        status: 'CREATED',
        name,
        options,
        qtumAmount: _.fill(Array(options), '0'),
        botAmount: _.fill(Array(options), '0'),
      };
      logger.debug(`Mutation Insert: Topic txid:${topic.txid}`);
      await DBHelper.insertOrUpdateTopic(Topics, topic);

      // Insert Oracle
      const oracle = {
        _id: txid,
        txid,
        version,
        status: 'CREATED',
        resultSetterAddress,
        token: 'QTUM',
        name,
        options,
        optionIdxs: Array.from(Array(options).keys()),
        amounts: _.fill(Array(options), '0'),
        startTime: bettingStartTime,
        endTime: bettingEndTime,
        resultSetStartTime: resultSettingStartTime,
        resultSetEndTime: resultSettingEndTime,
      };
      logger.debug(`Mutation Insert: Oracle txid:${oracle.txid}`);
      await DBHelper.insertOrUpdateCOracle(Oracles, oracle);

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type: 'CREATEEVENT',
        status: 'PENDING',
        senderAddress,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    createBet: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        oracleAddress,
        optionIdx,
        amount,
        senderAddress,
      } = data;

      // Send bet tx
      let txid;
      try {
        const tx = await centralizedOracle.bet({
          contractAddress: oracleAddress,
          index: optionIdx,
          amount,
          senderAddress,
        });
        txid = tx.txid;
      } catch (err) {
        logger.error(`Error calling CentralizedOracle.bet: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type: 'BET',
        status: 'PENDING',
        senderAddress,
        oracleAddress,
        optionIdx,
        token: 'QTUM',
        amount,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    setResult: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        topicAddress,
        oracleAddress,
        optionIdx,
        amount,
        senderAddress,
      } = data;

      // Make sure allowance is 0, or it needs to be reset
      let approveAmount;
      let type;
      if (await isAllowanceEnough(senderAddress, topicAddress, amount)) {
        approveAmount = amount;
        type = 'APPROVESETRESULT';
      } else {
        approveAmount = 0;
        type = 'RESETAPPROVESETRESULT';
      }

      // Send approve tx
      let txid;
      try {
        const tx = await bodhiToken.approve({
          spender: topicAddress,
          value: approveAmount,
          senderAddress,
        });
        txid = tx.txid;
      } catch (err) {
        logger.error(`Error calling BodhiToken.approve: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type,
        status: 'PENDING',
        senderAddress,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'BOT',
        amount,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    createVote: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        topicAddress,
        oracleAddress,
        optionIdx,
        amount,
        senderAddress,
      } = data;

      // Make sure allowance is 0, or it needs to be reset
      let approveAmount;
      let type;
      if (await isAllowanceEnough(senderAddress, topicAddress, amount)) {
        approveAmount = amount;
        type = 'APPROVEVOTE';
      } else {
        approveAmount = 0;
        type = 'RESETAPPROVEVOTE';
      }

      // Send approve tx
      let txid;
      try {
        const tx = await bodhiToken.approve({
          spender: topicAddress,
          value: approveAmount,
          senderAddress,
        });
        txid = tx.txid;
      } catch (err) {
        logger.error(`Error calling BodhiToken.approve: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type,
        status: 'PENDING',
        senderAddress,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'BOT',
        amount,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    finalizeResult: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        oracleAddress,
        senderAddress,
      } = data;

      // Send finalizeResult tx
      let txid;
      try {
        const tx = await decentralizedOracle.finalizeResult({
          contractAddress: oracleAddress,
          senderAddress,
        });
        txid = tx.txid;
      } catch (err) {
        logger.error(`Error calling DecentralizedOracle.finalizeResult: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type: 'FINALIZERESULT',
        status: 'PENDING',
        senderAddress,
        oracleAddress,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    withdraw: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        topicAddress,
        senderAddress,
      } = data;

      // Send withdraw tx
      let txid;
      try {
        const tx = await topicEvent.withdrawWinnings({
          contractAddress: topicAddress,
          senderAddress,
        });
        txid = tx.txid;
      } catch (err) {
        logger.error(`Error calling TopicEvent.withdrawWinnings: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type: 'WITHDRAW',
        status: 'PENDING',
        senderAddress,
        topicAddress,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    transfer: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        senderAddress,
        receiverAddress,
        token,
        amount,
      } = data;

      let txid;
      switch (token) {
        case 'QTUM': {
          // Send sendToAddress tx
          try {
            const tx = await wallet.sendToAddress({
              contractAddress: topicAddress,
              senderAddress,
            });
            txid = tx.txid;
          } catch (err) {
            logger.error(`Error calling Wallet.sendToAddress: ${err.message}`);
            throw err;
          }
          break;
        }
        case 'BOT': {
          // Send transfer tx
          try {
            const tx = await bodhiToken.transfer({
              contractAddress: topicAddress,
              senderAddress,
            });
            txid = tx.txid;
          } catch (err) {
            logger.error(`Error calling BodhiToken.transfer: ${err.message}`);
            throw err;
          }
          break;
        }
        default: {
          throw new Error(`Invalid token transfer type: ${token}`);
        }
      }
      txid = tx.txid;

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type: 'TRANSFER',
        status: 'PENDING',
        senderAddress,
        receiverAddress,
        token,
        amount,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },
  },

  Topic: {
    oracles: async ({ address }, data, { db: { Oracles } }) => Oracles.find({ topicAddress: address }),
  },

  Subscription: {
    onSyncInfo: {
      subscribe: () => pubsub.asyncIterator('onSyncInfo'),
    },
  },
};
