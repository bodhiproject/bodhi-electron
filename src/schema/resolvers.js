const _ = require('lodash');
const Web3Utils = require('web3-utils');
const moment = require('moment');

const pubsub = require('../pubsub');
const { getLogger } = require('../utils/logger');
const blockchain = require('../api/blockchain');
const wallet = require('../api/wallet');
const bodhiToken = require('../api/bodhi_token');
const eventFactory = require('../api/event_factory');
const topicEvent = require('../api/topic_event');
const centralizedOracle = require('../api/centralized_oracle');
const decentralizedOracle = require('../api/decentralized_oracle');
const { Config, getContractMetadata } = require('../config/config');
const DBHelper = require('../db/nedb').DBHelper;
const { txState } = require('../constants');
const { calculateSyncPercent, getAddressBalances } = require('../sync');
const Utils = require('../utils/utils');

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

function buildTopicFilters({
  OR = [], txid, address, status, resultIdx, creatorAddress,
}) {
  const filter = (txid || address || status || resultIdx || creatorAddress) ? {} : null;
  if (txid) {
    filter.txid = txid;
  }

  if (address) {
    filter.address = address;
  }

  if (status) {
    filter.status = status;
  }

  if (resultIdx) {
    filter.resultIdx = resultIdx;
  }

  if (creatorAddress) {
    filter.creatorAddress = creatorAddress;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildTopicFilters(OR[i]));
  }
  return filters;
}

function buildOracleFilters({
  OR = [], txid, address, topicAddress, resultSetterQAddress, status, token, excludeSelfAddress
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

  if(excludeSelfAddress) {
    filter.resultSetterQAddress = {$nin : excludeSelfAddress};
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
      let blocks;
      try {
        blocks = await Blocks.cfind({}).sort({ blockNum: -1 }).limit(1).exec();
      } catch (err) {
        getLogger().error(`Error query latest block from db: ${err.message}`);
      }

      let syncBlockNum;
      let syncBlockTime;
      if (blocks && blocks.length > 0) {
        // Use latest block synced
        syncBlockNum = blocks[0].blockNum;
        syncBlockTime = blocks[0].blockTime;
      } else {
        // Fetch current block from qtum
        syncBlockNum = Math.max(0, await blockchain.getBlockCount());
        const blockHash = await blockchain.getBlockHash({ blockNum: syncBlockNum });
        syncBlockTime = (await blockchain.getBlock({ blockHash })).time;
      }
      const syncPercent = await calculateSyncPercent(syncBlockNum, syncBlockTime);

      let addressBalances = [];
      if (includeBalance || false) {
        addressBalances = await getAddressBalances();
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
      const addressManagerAddr = getContractMetadata().AddressManager.address;

      // Check for existing CreateEvent transactions
      if (await DBHelper.isPreviousCreateEventPending(Transactions, senderAddress)) {
        getLogger().error('Pending CreateEvent transaction found.');
        throw new Error('Pending CreateEvent transaction found');
      }

      // Check the allowance first
      let type;
      let sentTx;
      if (await Utils.isAllowanceEnough(senderAddress, addressManagerAddr, amount)) {
        // Send createTopic tx
        type = 'CREATEEVENT';
        try {
          sentTx = await eventFactory.createTopic({
            oracleAddress: resultSetterAddress,
            eventName: name,
            resultNames: options,
            bettingStartTime,
            bettingEndTime,
            resultSettingStartTime,
            resultSettingEndTime,
            senderAddress,
          });
        } catch (err) {
          getLogger().error(`Error calling EventFactory.createTopic: ${err.message}`);
          throw err;
        }
      } else {
        // Send approve first since allowance is not enough
        type = 'APPROVECREATEEVENT';
        try {
          sentTx = await bodhiToken.approve({
            spender: addressManagerAddr,
            value: amount,
            senderAddress,
          });
        } catch (err) {
          getLogger().error(`Error calling BodhiToken.approve: ${err.message}`);
          throw err;
        }
      }

      const version = Config.CONTRACT_VERSION_NUM;

      // Insert Transaction
      const tx = {
        txid: sentTx.txid,
        type,
        status: txState.PENDING,
        createdTime: moment().unix(),
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        senderAddress,
        version,
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
        txid: sentTx.txid,
        status: 'CREATED',
        version,
        escrowAmount: amount,
        name,
        options,
        qtumAmount: _.fill(Array(options), '0'),
        botAmount: _.fill(Array(options), '0'),
        creatorAddress: senderAddress,
      };
      getLogger().debug(`Mutation Insert: Topic txid:${topic.txid}`);
      await DBHelper.insertTopic(Topics, topic);

      // Insert Oracle
      const oracle = {
        txid: sentTx.txid,
        status: 'CREATED',
        version,
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
      getLogger().debug(`Mutation Insert: Oracle txid:${oracle.txid}`);
      await DBHelper.insertOracle(Oracles, oracle);

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
      let sentTx;
      try {
        sentTx = await centralizedOracle.bet({
          contractAddress: oracleAddress,
          index: optionIdx,
          amount,
          senderAddress,
        });
      } catch (err) {
        getLogger().error(`Error calling CentralizedOracle.bet: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        txid: sentTx.txid,
        type: 'BET',
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress,
        version,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'QTUM',
        amount,
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
      let sentTx;
      if (await Utils.isAllowanceEnough(senderAddress, topicAddress, amount)) {
        // Send setResult since the allowance is enough
        type = 'SETRESULT';
        try {
          sentTx = await centralizedOracle.setResult({
            contractAddress: oracleAddress,
            resultIndex: optionIdx,
            senderAddress,
          });
        } catch (err) {
          getLogger().error(`Error calling CentralizedOracle.setResult: ${err.message}`);
          throw err;
        }
      } else {
        // Send approve first since allowance is not enough
        type = 'APPROVESETRESULT';
        try {
          sentTx = await bodhiToken.approve({
            spender: topicAddress,
            value: amount,
            senderAddress,
          });
        } catch (err) {
          getLogger().error(`Error calling BodhiToken.approve: ${err.message}`);
          throw err;
        }
      }

      // Insert Transaction
      const tx = {
        txid: sentTx.txid,
        type,
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress,
        version,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'BOT',
        amount,
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    createVote: async (root, data, { db: { Oracles, Transactions } }) => {
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
      let sentTx;
      if (await Utils.isAllowanceEnough(senderAddress, topicAddress, amount)) {
        // Send vote since allowance is enough
        type = 'VOTE';
        try {
          // Find if voting over threshold to set correct gas limit
          const gasLimit = await Utils.getVotingGasLimit(Oracles, oracleAddress, optionIdx, amount);

          sentTx = await decentralizedOracle.vote({
            contractAddress: oracleAddress,
            resultIndex: optionIdx,
            botAmount: amount,
            senderAddress,
            gasLimit,
          });
        } catch (err) {
          getLogger().error(`Error calling DecentralizedOracle.vote: ${err.message}`);
          throw err;
        }
      } else {
        // Send approve first because allowance is not enough
        type = 'APPROVEVOTE';
        try {
          sentTx = await bodhiToken.approve({
            spender: topicAddress,
            value: amount,
            senderAddress,
          });
        } catch (err) {
          getLogger().error(`Error calling BodhiToken.approve: ${err.message}`);
          throw err;
        }
      }

      // Insert Transaction
      const tx = {
        txid: sentTx.txid,
        type,
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress,
        version,
        topicAddress,
        oracleAddress,
        optionIdx,
        token: 'BOT',
        amount,
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    finalizeResult: async (root, data, { db: { Oracles, Transactions } }) => {
      const {
        version,
        topicAddress,
        oracleAddress,
        senderAddress,
      } = data;

      // Fetch oracle to get the finalized result
      const oracle = await Oracles.findOne({ address: oracleAddress }, { options: 1, optionIdxs: 1 });
      let winningIndex;
      if (!oracle) {
        getLogger().error(`Could not find Oracle ${address} in DB.`);
        throw new Error(`Could not find Oracle ${address} in DB.`);
      } else {
        // Compare optionIdxs to options since optionIdxs will be missing the index of the last round's result
        for (let i = 0; i < oracle.options.length; i++) {
          if (!_.includes(oracle.optionIdxs, i)) {
            winningIndex = i;
            break;
          }
        }
      }

      // Send finalizeResult tx
      let sentTx;
      try {
        sentTx = await decentralizedOracle.finalizeResult({
          contractAddress: oracleAddress,
          senderAddress,
        });
      } catch (err) {
        getLogger().error(`Error calling DecentralizedOracle.finalizeResult: ${err.message}`);
        throw err;
      }

      // Insert Transaction
      const tx = {
        txid: sentTx.txid,
        type: 'FINALIZERESULT',
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress,
        version,
        topicAddress,
        oracleAddress,
        optionIdx: winningIndex,
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },

    withdraw: async (root, data, { db: { Transactions } }) => {
      const {
        type,
        version,
        topicAddress,
        senderAddress,
      } = data;

      let sentTx;
      switch (type) {
        case 'WITHDRAW': {
          // Send withdrawWinnings tx
          try {
            sentTx = await topicEvent.withdrawWinnings({
              contractAddress: topicAddress,
              senderAddress,
            });
          } catch (err) {
            getLogger().error(`Error calling TopicEvent.withdrawWinnings: ${err.message}`);
            throw err;
          }
          break;
        }
        case 'WITHDRAWESCROW': {
          // Send withdrawEscrow tx
          try {
            sentTx = await topicEvent.withdrawEscrow({
              contractAddress: topicAddress,
              senderAddress,
            });
          } catch (err) {
            getLogger().error(`Error calling TopicEvent.withdrawEscrow: ${err.message}`);
            throw err;
          }
          break;
        }
        default: {
          throw new Error(`Invalid withdraw type: ${type}`);
        }
      }

      // Insert Transaction
      const tx = {
        txid: sentTx.txid,
        type,
        status: txState.PENDING,
        gasLimit: sentTx.args.gasLimit.toString(10),
        gasPrice: sentTx.args.gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress,
        version,
        topicAddress,
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
      let sentTx;
      switch (token) {
        case 'QTUM': {
          // Send sendToAddress tx
          try {
            txid = await wallet.sendToAddress({
              address: receiverAddress,
              amount,
              senderAddress,
              changeToAddress: true,
            });
          } catch (err) {
            getLogger().error(`Error calling Wallet.sendToAddress: ${err.message}`);
            throw err;
          }
          break;
        }
        case 'BOT': {
          // Send transfer tx
          try {
            sentTx = await bodhiToken.transfer({
              to: receiverAddress,
              value: amount,
              senderAddress,
            });
            txid = sentTx.txid;
          } catch (err) {
            getLogger().error(`Error calling BodhiToken.transfer: ${err.message}`);
            throw err;
          }
          break;
        }
        default: {
          throw new Error(`Invalid token transfer type: ${token}`);
        }
      }

      // Insert Transaction
      const gasLimit = sentTx ? sentTx.args.gasLimit : Config.DEFAULT_GAS_LIMIT;
      const gasPrice = sentTx ? sentTx.args.gasPrice : Config.DEFAULT_GAS_PRICE;
      const tx = {
        txid,
        type: 'TRANSFER',
        status: txState.PENDING,
        gasLimit: gasLimit.toString(10),
        gasPrice: gasPrice.toFixed(8),
        createdTime: moment().unix(),
        senderAddress,
        version,
        receiverAddress,
        token,
        amount,
      };
      await DBHelper.insertTransaction(Transactions, tx);

      return tx;
    },
  },

  Topic: {
    oracles: async ({ address }, data, { db: { Oracles } }) => Oracles.find({ topicAddress: address }),
    transactions: async ({ address }, data, { db: { Transactions } }) => Transactions.find({ topicAddress: address }),
  },

  Oracle: {
    transactions: async ({ address }, data, { db: { Transactions } }) => Transactions.find({ oracleAddress: address }),
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
