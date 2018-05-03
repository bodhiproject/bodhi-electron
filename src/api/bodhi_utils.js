const { Utils } = require('qweb3');

const BodhiUtils = {
  async isValidQTUMAddress(args) {
    const {
      address,
    } = args;

    return new Utils(isQtumAddress(address));
  },
};

module.exports = BodhiUtils;
