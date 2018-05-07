const { getInstance } = require('../qclient');

const QtumUtils = {
  async isValidQtumAddress(args) {
    const {
      address,
    } = args;

	if (_.isUndefined(address)) {
      throw new TypeError('address needs to be defined');
    }

    return getInstance().validateAddress(address);
  },
};

module.exports = QtumUtils;
