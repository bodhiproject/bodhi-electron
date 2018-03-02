const _ = require('lodash');
const { Contract } = require('qweb3');

const { Config, getContractMetadata } = require('../config/config');

const metadata = getContractMetadata();
const contract = new Contract(Config.QTUM_RPC_ADDRESS, metadata.AddressManager.address, metadata.AddressManager.abi);

const AddressManager = {
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
};

module.exports = AddressManager;
