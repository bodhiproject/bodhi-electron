const _ = require('lodash');
const { Contract } = require('qweb3');

const { getContractMetadata, getQtumRPCAddress } = require('../config/config');
const Utils = require('../utils/utils');

function getContract() {
  const metadata = getContractMetadata();
  return new Contract(getQtumRPCAddress(), metadata.BodhiToken.address, metadata.BodhiToken.abi);
}

const BodhiToken = {
  async approve(args) {
    const {
      spender, // address
      value, // string: Botoshi
      senderAddress, // address
    } = args;

    if (_.isUndefined(spender)) {
      throw new TypeError('spender needs to be defined');
    }
    if (_.isUndefined(value)) {
      throw new TypeError('value needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    return getContract().send('approve', {
      methodArgs: [spender, value],
      senderAddress,
    });
  },

  async transfer(args) {
    const {
      to, // address
      value, // string: Botoshi
      senderAddress, // address
    } = args;

    if (_.isUndefined(to)) {
      throw new TypeError('to needs to be defined');
    }
    if (_.isUndefined(value)) {
      throw new TypeError('value needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    return getContract().send('transfer', {
      methodArgs: [to, value],
      senderAddress,
    });
  },

  async allowance(args) {
    const {
      owner, // address
      spender, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(owner)) {
      throw new TypeError('owner needs to be defined');
    }
    if (_.isUndefined(spender)) {
      throw new TypeError('spender needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const res = await getContract().call('allowance', {
      methodArgs: [owner, spender],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    res.remaining = Utils.hexToDecimalString(res.remaining);
    return res;
  },

  async balanceOf(args) {
    const {
      owner, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(owner)) {
      throw new TypeError('owner needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const res = await getContract().call('balanceOf', {
      methodArgs: [owner],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    res.balance = Utils.hexToDecimalString(res.balance);
    return res;
  },
};

module.exports = BodhiToken;
