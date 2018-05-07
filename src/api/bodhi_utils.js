const { getInstance } = require('../qclient');

const BodhiUtils = {
  async isValidQtumAddress(args) {
    const {
      address,
    } = args;

    return getInstance().validateAddress(address);
  },
};

module.exports = BodhiUtils;
