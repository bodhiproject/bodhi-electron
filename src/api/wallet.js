const _ = require('lodash');

const { getInstance } = require('../qclient');

const Wallet = {
  async getAccountAddress(args) {
    const {
      accountName, // string
    } = args;

    if (_.isUndefined(accountName)) {
      throw new TypeError('accountName needs to be defined');
    }

    return getInstance().getAccountAddress(accountName);
  },

  async getTransaction(args) {
    const {
      txid, // string
    } = args;

    if (_.isUndefined(txid)) {
      throw new TypeError('txid needs to be defined');
    }

    return getInstance().getTransaction(txid);
  },

  async getWalletInfo() {
    return getInstance().getWalletInfo();
  },

  async listAddressGroupings() {
    return getInstance().listAddressGroupings();
  },

  async listUnspent() {
    return getInstance().listUnspent();
  },

  async sendToAddress(args) {
    const {
      address, // string: QTUM address
      amount, // string: QTUM decimal
      comment, // string
      commentTo, // string
      subtractFeeFromAmount, // boolean
      senderAddress, // string: QTUM address
      changeToAddress, // boolean
    } = args;

    if (_.isUndefined(address)) {
      throw new TypeError('address needs to be defined');
    }
    if (_.isUndefined(amount)) {
      throw new TypeError('amount needs to be defined');
    }

    return getInstance().sendToAddress(
      address, amount, comment, commentTo, subtractFeeFromAmount, senderAddress,
      changeToAddress,
    );
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

    return getInstance().walletPassphrase(passphrase, timeout);
  },

  async walletLock() {
    return getInstance().walletLock();
  },

  async encryptWallet(args) {
    const {
      passphrase, // string
    } = args;

    if (_.isUndefined(passphrase)) {
      throw new TypeError('passphrase needs to be defined');
    }

    return getInstance().encryptWallet(passphrase);
  },

  async walletPassphraseChange(args) {
    const {
      oldPassphrase, // string
      newPassphrase, // string
    } = args;

    if (_.isUndefined(oldPassphrase)) {
      throw new TypeError('oldPassphrase needs to be defined');
    }
    if (_.isUndefined(newPassphrase)) {
      throw new TypeError('newPassphrase needs to be defined');
    }

    return getInstance().walletPassphraseChange(oldPassphrase, newPassphrase);
  },

  async backupWallet(args) {
    const {
      destination, // string
    } = args;

    if (_.isUndefined(destination)) {
      throw new TypeError('destination needs to be defined');
    }

    return getInstance().backupWallet(destination);
  },

  async importWallet(args) {
    const {
      filename, // string
    } = args;

    if (_.isUndefined(filename)) {
      throw new TypeError('filename needs to be defined');
    }

    return getInstance().importWallet(filename);
  },
};

module.exports = Wallet;
