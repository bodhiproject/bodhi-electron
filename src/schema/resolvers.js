/* eslint no-underscore-dangle: [2, { "allow": ["_id"] }] */

const _ = require('lodash');
const fetch = require('node-fetch');
const Web3Utils = require('web3-utils');
const moment = require('moment');

const pubsub = require('../pubsub');
const logger = require('../utils/logger');
const wallet = require('../api/wallet');
const bodhiToken = require('../api/bodhi_token');
const eventFactory = require('../api/event_factory');
const topicEvent = require('../api/topic_event');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const { Config, getContractMetadata } = require('../config/config');
const DBHelper = require('../db/nedb').DBHelper;
const { txState } = require('../constants');
const { calculateSyncPercent, listUnspentBalance } = require('../sync');

const DEFAULT_LIMIT_NUM = 50;
const DEFAULT_SKIP_NUM = 0;

const contractMetadata = getContractMetadata();

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

function buildTopicFilters({
  OR = [], txid, address, status,
}) {
  const filter = (address || status || txid) ? {} : null;
  if (txid) {
    filter.txid = txid;
  }

  if (address) {
    filter.address = address;
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
  OR = [], txid, address, topicAddress, resultSetterQAddress, status, token,
}) {
  const filter = (txid || address || topicAddress || resultSetterQAddress || status || token) ? {} : null;
  if (txid) {
    filter.txid = txid;
  }

  if (address) {
    filter.address = address;
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
  OR = [], topicAddress, oracleAddress, voterAddress, voterQAddress, optionIdx,
}) {
  const filter = (topicAddress || oracleAddress || voterAddress || voterQAddress || optionIdx) ? {} : null;

  if (topicAddress) {
    filter.topicAddress = topicAddress;
  }

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

    allTransactions: async (root, {
      filter, orderBy, limit, skip,
    }, { db: { Transactions } }) => {
      const query = filter ? { $or: buildTransactionFilters(filter) } : {};
      let cursor = Transactions.cfind(query);
      cursor = buildCursorOptions(cursor, orderBy, limit, skip);
      return cursor.exec();
    },

    syncInfo: async (root, { includeBalance }, { db: { Blocks } }) => {
      const fetchBalance = includeBalance || false;
      let syncBlockNum = null;
      let syncBlockTime = null;
      let syncPercent = null;
      let blocks;
      try {
        blocks = await Blocks.cfind({}).sort({ blockNum: -1 }).limit(1).exec();
      } catch (err) {
        logger.error(`Error query latest block from db: ${err.message}`);
      }

      if (blocks.length > 0) {
        syncBlockNum = blocks[0].blockNum;
        syncBlockTime = blocks[0].blockTime;
        syncPercent = calculateSyncPercent(syncBlockTime);
      }

      let addressBalances = [];
      if (fetchBalance) {
        addressBalances = await listUnspentBalance();
      }

      return {
        syncBlockNum,
        syncBlockTime,
        syncPercent,
        addressBalances,
      };
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
        amount,
        senderAddress,
      } = data;
      const addressManagerAddr = contractMetadata.AddressManager.address;

      // Check the allowance first
      let type;
      let txid;
      if (await isAllowanceEnough(senderAddress, addressManagerAddr, amount)) {
        // Send createTopic tx
        type = 'CREATEEVENT';
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
      } else {
        // Send approve first since allowance is not enough
        type = 'APPROVECREATEEVENT';
        try {
          const approveTx = await bodhiToken.approve({
            spender: addressManagerAddr,
            value: amount,
            senderAddress,
          });
          txid = approveTx.txid;
        } catch (err) {
          logger.error(`Error calling BodhiToken.approve: ${err.message}`);
          throw err;
        }
      }

      const version = Config.CONTRACT_VERSION_NUM;

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type,
        status: txState.PENDING,
        createdTime: moment().unix(),
        senderAddress,
        name,
        options,
        resultSetterAddress,
        bettingStartTime,
        bettingEndTime,
        resultSettingStartTime,
        resultSettingEndTime,
        amount,
        token: 'BOT',
      };
      await DBHelper.insertTransaction(Transactions, tx);

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

      return tx;
    },

    createBet: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        topicAddress,
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
        status: txState.PENDING,
        senderAddress,
        topicAddress,
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

      // Check the allowance first
      let type;
      let txid;
      if (await isAllowanceEnough(senderAddress, topicAddress, amount)) {
        // Send setResult since the allowance is enough
        type = 'SETRESULT';
        try {
          const setResultTx = await centralizedOracle.setResult({
            contractAddress: oracleAddress,
            resultIndex: optionIdx,
            senderAddress,
          });
          txid = setResultTx.txid;
        } catch (err) {
          logger.error(`Error calling CentralizedOracle.setResult: ${err.message}`);
          throw err;
        }
      } else {
        // Send approve first since allowance is not enough
        type = 'APPROVESETRESULT';
        try {
          const approveTx = await bodhiToken.approve({
            spender: topicAddress,
            value: amount,
            senderAddress,
          });
          txid = approveTx.txid;
        } catch (err) {
          logger.error(`Error calling BodhiToken.approve: ${err.message}`);
          throw err;
        }
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        type,
        status: txState.PENDING,
        createdTime: moment().unix(),
        version,
        senderAddress,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'BOT',
        amount,
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

      // Check allowance
      let type;
      let txid;
      if (await isAllowanceEnough(senderAddress, topicAddress, amount)) {
        // Send vote since allowance is enough
        type = 'VOTE';
        try {
          const voteTx = await decentralizedOracle.vote({
            contractAddress: oracleAddress,
            resultIndex: optionIdx,
            botAmount: amount,
            senderAddress,
          });
          txid = voteTx.txid;
        } catch (err) {
          logger.error(`Error calling DecentralizedOracle.vote: ${err.message}`);
          throw err;
        }
      } else {
        // Send approve first because allowance is not enough
        type = 'APPROVEVOTE';
        try {
          const approveTx = await bodhiToken.approve({
            spender: topicAddress,
            value: amount,
            senderAddress,
          });
          txid = approveTx.txid;
        } catch (err) {
          logger.error(`Error calling BodhiToken.approve: ${err.message}`);
          throw err;
        }
      }

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        type,
        status: txState.PENDING,
        createdTime: moment().unix(),
        version,
        senderAddress,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'BOT',
        amount,
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    finalizeResult: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        topicAddress,
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
        status: txState.PENDING,
        senderAddress,
        topicAddress,
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
        status: txState.PENDING,
        senderAddress,
        topicAddress,
        createdTime: moment().unix(),
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    transfer: async (root, data, { db: { Transactions } }) => {
      const {
        senderAddress,
        receiverAddress,
        token,
        amount,
      } = data;

      const version = Config.CONTRACT_VERSION_NUM;

      let txid;
      switch (token) {
        case 'QTUM': {
          // Send sendToAddress tx
          try {
            const tx = await wallet.sendToAddress({
              address: receiverAddress,
              amount,
            });
            txid = tx;
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
              to: receiverAddress,
              value: amount,
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

      // Insert Transaction
      const tx = {
        _id: txid,
        txid,
        version,
        type: 'TRANSFER',
        status: txState.PENDING,
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

  Transaction: {
    topic: async ({ topicAddress }, data, { db: { Topics } }) => {
      if (_.isEmpty(topicAddress)) {
        return null;
      }

      const topics = await Topics.find({ address: topicAddress });
      if (!_.isEmpty(topics)) {
        return topics[0];
      }
      return null;
    },
  },

  Subscription: {
    onSyncInfo: {
      subscribe: () => pubsub.asyncIterator('onSyncInfo'),
    },
  },
};
