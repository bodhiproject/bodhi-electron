const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const { app } = require('electron');
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
}

module.exports = Utils;
