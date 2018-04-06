const fs = require('fs-extra');
const _ = require('lodash');
const { app } = require('electron');
const Web3Utils = require('web3-utils');

const { Config } = require('../config/config');
const { version } = require('../../package.json');

const DIR_DEV = 'dev';

class Utils {
  /*
  * Returns the path where the data directory is, and also creates the directory if it doesn't exist.
  */
  static getDataDir() {
    const osDataDir = app.getPath('userData');

    let dataDir;
    if (_.indexOf(process.argv, '--dev') === -1) {
      const pathPrefix = Config.TESTNET ? 'testnet' : 'mainnet';

      const lastPeriodIndex = _.lastIndexOf(version, ".");
      if (lastPeriodIndex === -1) {
        throw new Error(`Invalid version number: ${version}`);
      }
      // Example: 0.6.5-c0-d1
      // c0 = contract version 0, d1 = db version 1
      const patchVersionArr = version.substr(lastPeriodIndex + 1).split('-'); // 5-c0-d1
      const versionDir = `${patchVersionArr[1]}_${patchVersionArr[2]}` // c0_d1

      // production
      dataDir = `${osDataDir}/${pathPrefix}/${versionDir}`;
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

  // Get correct gas limit determined if voting over consensus threshold or not
  static async getVotingGasLimit(oraclesDb, oracleAddress, voteOptionIdx, voteAmount) {
    const oracle = await oraclesDb.findOne({ address: oracleAddress }, { consensusThreshold: 1, amounts: 1 });
    if (!oracle) {
      logger.error(`Could not find Oracle ${oracleAddress} in DB.`);
      throw new Error(`Could not find Oracle ${oracleAddress} in DB.`);
    }

    const threshold = Web3Utils.toBN(oracle.consensusThreshold);
    const currentTotal = Web3Utils.toBN(oracle.amounts[voteOptionIdx]);
    const maxVote = threshold.sub(currentTotal);
    return Web3Utils.toBN(voteAmount).gte(maxVote) ? Config.CREATE_DORACLE_GAS_LIMIT : Config.DEFAULT_GAS_LIMIT;
  }
}

module.exports = Utils;
