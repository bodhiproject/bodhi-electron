const _ = require('lodash');
const { Contract } = require('qweb3');

const { getContractMetadata, getQtumRPCAddress } = require('../config/config');
const Utils = require('../utils/utils');

function getContract() {
  const metadata = getContractMetadata();
  return new Contract(getQtumRPCAddress(), metadata.AddressManager.address, metadata.AddressManager.abi);
}

const AddressManager = {
  async eventEscrowAmount(args) {
    const {
      senderAddress, // address
    } = args;

    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const res = await getContract().call('eventEscrowAmount', {
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

    const res = await getContract().call('getLastEventFactoryIndex', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    return res;
  },

  async getLastOracleFactoryIndex(args) {
    const {
      senderAddress, // address
    } = args;

    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const res = await getContract().call('getLastOracleFactoryIndex', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    return res;
  },
};

module.exports = AddressManager;
