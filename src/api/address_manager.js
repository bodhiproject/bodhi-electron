const _ = require('lodash');
const { Contract } = require('qweb3');

const { Config, getContractMetadata } = require('../config/config');
const Utils = require('../utils/utils');

const metadata = getContractMetadata();
const contract = new Contract(Config.QTUM_RPC_ADDRESS, metadata.AddressManager.address, metadata.AddressManager.abi);

const AddressManager = {
  async eventEscrowAmount(args) {
    const {
      senderAddress, // address
    } = args;

    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const res = await contract.call('eventEscrowAmount', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    return res;
  },

  async getLastEventFactoryIndex(args) {
    const {
      senderAddress, // address
    } = args;

    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    return contract.call('getLastEventFactoryIndex', {
      methodArgs: [],
      senderAddress,
    });
  },

  async getLastOracleFactoryIndex(args) {
    const {
      senderAddress, // address
    } = args;

    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    return contract.call('getLastOracleFactoryIndex', {
      methodArgs: [],
      senderAddress,
    });
  },
};

module.exports = AddressManager;
