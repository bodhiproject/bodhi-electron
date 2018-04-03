const fs = require('fs-extra');
const _ = require('lodash');
const { app } = require('electron');
const Web3Utils = require('web3-utils');

const { Config } = require('../config/config');

const DIR_DEV = 'dev';

class Utils {
  /*
  * Returns the path where the data directory is, and also creates the directory if it doesn't exist.
  */
  static getDataDir() {
    const osDataDir = app.getPath('userData');

    let dataDir;
    if (_.indexOf(process.argv, '--dev') === -1) {
      const version = Config.CONTRACT_VERSION_NUM;
      const testnet = Config.TESTNET;
      const pathPrefix = testnet ? 'testnet' : 'mainnet';

      // production
      dataDir = `${osDataDir}/${pathPrefix}/${version}`;
    } else {
      // development
      dataDir = `${osDataDir}/${DIR_DEV}`;
    }

    // Create data dir if needed
    fs.ensureDirSync(dataDir);

    return dataDir;
  }

  /*
  * Converts a hex number to decimal string.
  * @param input {String|Hex|BN} The hex number to convert.
  */
  static hexToDecimalString(input) {
    if (!input) {
      return undefined;
    }

    if (Web3Utils.isBN(input)) {
      return input.toString(10);
    }

    if (Web3Utils.isHex(input)) {
      return Web3Utils.toBN(input).toString(10);
    }

    return input.toString();
  }

  static hexArrayToDecimalArray(array) {
    if (!array) {
      return undefined;
    }

    return _.map(array, item => this.hexToDecimalString(item));
  }
}

module.exports = Utils;
