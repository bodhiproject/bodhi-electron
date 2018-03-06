const _ = require('lodash');
const { Qweb3 } = require('qweb3');

const { Config } = require('../config/config');

const qClient = new Qweb3(Config.QTUM_RPC_ADDRESS);

const Wallet = {
  async getAccountAddress(args) {
    const {
      accountName, // string
    } = args;

    if (_.isUndefined(accountName)) {
      throw new TypeError('accountName needs to be defined');
    }

    return qClient.getAccountAddress(accountName);
  },

  async listUnspent() {
    return qClient.listUnspent();
  },

  async sendToAddress(args) {
    address, amount, comment = '', commentTo = '', subtractFeeFromAmount = false) {
    const {
      address, // string: QTUM address
      amount, // number
      comment, // string
      commentTo, // string
      subtractFeeFromAmount, // boolean
    } = args;

    if (_.isUndefined(address)) {
      throw new TypeError('address needs to be defined');
    }
    if (_.isUndefined(amount)) {
      throw new TypeError('amount needs to be defined');
    }
    if (!_.isNumber(amount)) {
      throw new TypeError('amount needs to be a number');
    }

    return qClient.sendToAddress(address, amount, comment, commentTo, subtractFeeFromAmount);
  }
};

module.exports = Wallet;
