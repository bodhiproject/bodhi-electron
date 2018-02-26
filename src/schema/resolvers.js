/* eslint no-underscore-dangle: [2, { "allow": ["_id"] }] */

const _ = require('lodash');
const fetch = require('node-fetch');

const pubsub = require('../pubsub');
const logger = require('../utils/logger');
const topicEvent = require('../api/topic_event');
const decentralizedOracle = require('../api/decentralized_oracle');

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
        version,
        resultSetterAddress,
        name,
        options,
        bettingStartTime,
        bettingEndTime,
        resultSettingStartTime,
        resultSettingEndTime,
        senderAddress,
      } = data;

      // rpc call first
      const payload = {
        oracleAddress: resultSetterAddress,
        eventName: name,
        resultNames: options,
        bettingStartTime,
        bettingEndTime,
        resultSettingStartTime,
        resultSettingEndTime,
        senderAddress,
      };

      let txid;
      try {
        const resp = await fetch('http://localhost:5555/create-topic', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json());

        txid = resp.result.txid;
      } catch (err) {
        logger.error(`Error call /create-topic: ${err.message}`);
        throw err;
      }

      const topic = {
        _id: txid,
        version,
        txid,
        status: 'CREATED',
        name,
        options,
        qtumAmount: _.fill(Array(options), '0'),
        botAmount: _.fill(Array(options), '0'),
      };

      const oracle = {
        _id: txid,
        version,
        txid,
        resultSetterAddress,
        status: 'CREATED',
        token: 'QTUM',
        name,
        options,
        optionIdxs: Array.from(Array(options).keys()),
        amounts: _.fill(Array(options), '0'),
        startTime: bettingStartTime,
        endTime: bettingEndTime,
        resultSettingStartTime,
        resultSettingEndTime,
      };

      const tx = {
        _id: txid,
        txid,
        version,
        type: 'CREATEEVENT',
        txStatus: 'PENDING',
        senderAddress,
        createdTime: Date.now().toString(),
      };

      try {
        await Topics.insert(topic);
        await Oracles.insert(oracle);
        await Transactions.insert(tx);
      } catch (err) {
        logger.error(`Error insertion db: ${err.message}`);
        throw err;
      }

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

      let txid;
      try {
        const resp = await fetch('http://localhost:5555/bet', {
          method: 'POST',
          body: JSON.stringify({
            oracleAddress,
            index: optionIdx,
            amount,
            senderAddress,
          }),
          headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json());

        txid = resp.result.txid;
      } catch (err) {
        logger.error(`Error call /approve: ${err.message}`);
        throw err;
      }

      const tx = {
        _id: txid,
        version,
        txid,
        type: 'BET',
        status: 'PENDING',
        senderAddress,
        entityId: oracleAddress,
        optionIdx,
        token: 'QTUM',
        amount,
      };

      try {
        await Transactions.insert(tx);
      } catch (err) {
        logger.error(`Error insert Transactions: ${err.message}`);
        throw err;
      }

      return tx;
    },

    setResult: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        oracleAddress,
        resultIdx,
        consensusThreshold,
        senderAddress,
      } = data;

      // rpc call to approve
      let approveTxid;
      try {
        const resp = await fetch('http://localhost:5555/approve', {
          method: 'POST',
          body: JSON.stringify({
            spender: oracleAddress,
            value: consensusThreshold,
            senderAddress,
          }),
          headers: { 'Content-Type': 'application/json' },
        }).then(res => res.json());

        approveTxid = resp.result.txid;
      } catch (err) {
        logger.error(`Error call /approve: ${err.message}`);
        throw err;
      }

      const tx = {
        _id: approveTxid,
        version,
        type: 'APPROVESETRESULT',
        status: 'PENDING',
        senderAddress,
        entityId: oracleAddress,
        optionIdx: resultIdx,
        token: 'QTUM',
        amount: consensusThreshold,
        createdTime: Date.now().toString(),
      };

      try {
        await Transactions.insert(tx);
      } catch (err) {
        logger.error(`Error insert Transactions: ${err.message}`);
        throw err;
      }

      return tx;
    },

    createVote: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        oracleAddress
        optionIdx
        amount
        senderAddress,
      } = data;

      // Send tx
      let txid;
      try {
        const tx = decentralizedOracle.vote({
          contractAddress: oracleAddress,
          resultIndex: optionIdx,
          botAmount: amount,
          senderAddress,
        });
        txid = tx.result.txid;
      } catch (err) {
        logger.error(`Error calling /vote: ${err.message}`);
        throw err;
      }

      // Construct tx object
      const tx = {
        _id: txid,
        version,
        type: 'APPROVEVOTE',
        status: 'PENDING',
        senderAddress,
        entityId: oracleAddress,
        optionIdx: resultIdx,
        token: 'BOT',
        amount,
        createdTime: Date.now().toString(),
      };

      // Insert in DB
      try {
        await Transactions.insert(tx);
      } catch (err) {
        logger.error(`Error inserting Transactions.createVote: ${err.message}`);
        throw err;
      }

      return tx;
    },

    finalizeResult: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        oracleAddress,
        senderAddress,
      } = data;

      // Send tx
      let txid;
      try {
        const tx = decentralizedOracle.finalizeResult({
          contractAddress: oracleAddress,
          senderAddress,
        });
        txid = tx.result.txid;
      } catch (err) {
        logger.error(`Error calling /finalizeResult: ${err.message}`);
        throw err;
      }

      // Construct tx object
      const tx = {
        _id: txid,
        version,
        type: 'FINALIZERESULT',
        status: 'PENDING',
        senderAddress,
        entityId: oracleAddress,
        createdTime: Date.now().toString(),
      };

      // Insert in DB
      try {
        await Transactions.insert(tx);
      } catch (err) {
        logger.error(`Error inserting Transactions.finalizeResult: ${err.message}`);
        throw err;
      }

      return tx;
    },

    withdraw: async (root, data, { db: { Transactions } }) => {
      const {
        version,
        topicAddress,
        senderAddress,
      } = data;

      // Send tx
      let txid;
      try {
        const tx = topicEvent.withdrawWinnings({
          contractAddress: topicAddress,
          senderAddress,
        });
        txid = tx.result.txid;
      } catch (err) {
        logger.error(`Error calling /withdraw: ${err.message}`);
        throw err;
      }

      // Construct tx object
      const tx = {
        _id: txid,
        version,
        type: 'WITHDRAW',
        status: 'PENDING',
        senderAddress,
        entityId: topicAddress,
        createdTime: Date.now().toString(),
      };

      // Insert in DB
      try {
        await Transactions.insert(tx);
      } catch (err) {
        logger.error(`Error inserting Transactions.withdraw: ${err.message}`);
        throw err;
      }

      return tx;
    },
  },

  Topic: {
    oracles: async ({ address }, data, { db: { Oracles } }) => Oracles.find({ topicAddress: address }),
  },

  Subscription: {
    OnSyncInfo: {
      subscribe: () => pubsub.asyncIterator('OnSyncInfo'),
    },
  },
};
