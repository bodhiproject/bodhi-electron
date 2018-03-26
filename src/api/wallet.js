const _ = require('lodash');

const qClient = require('../qclient').getInstance();

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

  async getTransaction(args) {
    const {
      txid, // string
    } = args;

    if (_.isUndefined(txid)) {
      throw new TypeError('txid needs to be defined');
    }

    return qClient.getTransaction(txid);
  },

  async getWalletInfo() {
    return qClient.getWalletInfo();
  },

  async listAddressGroupings() {
    return qClient.listAddressGroupings();
  },

  async listUnspent() {
    return qClient.listUnspent();
  },

  async sendToAddress(args) {
    const {
      address, // string: QTUM address
      amount, // string: QTUM decimal
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

    return qClient.sendToAddress(address, amount, comment, commentTo, subtractFeeFromAmount);
  },

  async walletPassphrase(args) {
    const {
      passphrase, // string
      timeout, // number: seconds
    } = args;

    if (_.isUndefined(passphrase)) {
      throw new TypeError('passphrase needs to be defined');
    }
    if (_.isUndefined(timeout)) {
      throw new TypeError('timeout needs to be defined');
    }
    if (!_.isFinite(timeout) || timeout <= 0) {
      throw new TypeError('timeout needs to be greater than 0');
    }

    return qClient.walletPassphrase(passphrase, timeout);
  },
};

module.exports = Wallet;
