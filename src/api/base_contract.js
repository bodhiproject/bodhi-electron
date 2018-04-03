const _ = require('lodash');
const { Contract } = require('qweb3');

const { Config, getContractMetadata } = require('../config/config');
const Utils = require('../utils/utils');

function getContract(contractAddress) {
  const metadata = getContractMetadata();
  return new Contract(Config.QTUM_RPC_ADDRESS, contractAddress, metadata.BaseContract.abi);
}

const BaseContract = {
  async version(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    const res = await contract.call('version', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    return res;
  },

  async resultIndex(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    const res = await contract.call('resultIndex', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    return res;
  },

  async getBetBalances(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    const res = await contract.call('getBetBalances', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexArrayToDecimalArray(res[0]);
    return res;
  },

  async getVoteBalances(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    const res = await contract.call('getVoteBalances', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexArrayToDecimalArray(res[0]);
    return res;
  },

  async getTotalBets(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    const res = await contract.call('getTotalBets', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexArrayToDecimalArray(res[0]);
    return res;
  },

  async getTotalVotes(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    const res = await contract.call('getTotalVotes', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexArrayToDecimalArray(res[0]);
    return res;
  },
};

module.exports = BaseContract;
