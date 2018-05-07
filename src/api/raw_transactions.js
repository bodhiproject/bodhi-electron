const { getInstance } = require('../qclient');

const RawTransactions = {
  async isValidQTUMAddress(args) {
    const {
      address,
    } = args;

    return getInstance().validateAddress(address);
  },
};

module.exports = RawTransactions;
