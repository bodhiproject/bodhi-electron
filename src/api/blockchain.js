const _ = require('lodash');

const { getContractMetadata } = require('../config/config');
const { getInstance } = require('../qclient');

const Blockchain = {
  async getBlock(args) {
    const {
      blockHash, // string
    } = args;

    if (_.isUndefined(blockHash)) {
      throw new TypeError('blockHash needs to be defined');
    }

    return getInstance().getBlock(blockHash);
  },

  async getBlockchainInfo() {
    return getInstance().getBlockchainInfo();
  },

  async getBlockCount() {
    return getInstance().getBlockCount();
  },

  async getBlockHash(args) {
    const {
      blockNum, // number
    } = args;

    if (_.isUndefined(blockNum)) {
      throw new TypeError('blockNum needs to be defined');
    }

    return getInstance().getBlockHash(blockNum);
  },

  async getTransactionReceipt(args) {
    const {
      transactionId, // string
    } = args;

    if (_.isUndefined(transactionId)) {
      throw new TypeError('transactionId needs to be defined');
    }

    return getInstance().getTransactionReceipt(transactionId);
  },

  async searchLogs(args) {
    const {
      fromBlock, // number
      toBlock, // number
    } = args;
    let {
      addresses, // string array
      topics, // string array
    } = args;

    if (_.isUndefined(fromBlock)) {
      throw new TypeError('fromBlock needs to be defined');
    }
    if (_.isUndefined(toBlock)) {
      throw new TypeError('toBlock needs to be defined');
    }

    if (addresses === undefined) {
      addresses = [];
    }

    if (topics === undefined) {
      topics = [];
    }

    return getInstance().searchLogs(fromBlock, toBlock, addresses, topics, getContractMetadata(), true);
  },
};

module.exports = Blockchain;
