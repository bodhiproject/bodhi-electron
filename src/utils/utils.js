const fs = require('fs-extra');
const _ = require('lodash');
const { app } = require('electron');
const Web3Utils = require('web3-utils');
const moment = require('moment');

const { Config, isMainnet } = require('../config/config');
const { version } = require('../../package.json');
const { execFile } = require('../constants');

const DIR_DEV = 'dev';

/*
* Gets the dev env qtum path for either qtumd or qtum-qt.
* @param exec {String} The exec file type needed to be returned.
* return {String} The full dev path for qtumd or qtum-qt.
*/
function getDevQtumPath(exec) {
  // dev, must pass in the absolute path to the bin/ folder
  const qtumPath = (_.split(process.argv[2], '=', 2))[1];

  switch (exec) {
    case execFile.QTUMD: {
      return `${qtumPath}/qtumd`;
    }
    case execFile.QTUM_QT: {
      return `${qtumPath}/qtum-qt`;
    }
    default: {
      throw new Error(`Invalid execFile type: ${exec}`);
    }
  }
}

/*
* Gets the prod env qtum path for either qtumd or qtum-qt.
* @param execFile {String} The exec file type needed to be returned.
* return {String} The full prod path for qtumd or qtum-qt.
*/
function getProdQtumPath(exec) {
  let path;
  const arch = process.arch;

  switch (process.platform) {
    case 'darwin': {
      switch (exec) {
        case execFile.QTUMD: {
          path = `${app.getAppPath()}/qtum/mac/bin/qtumd`;
          break;
        }
        case execFile.QTUM_QT: {
          path = `${app.getAppPath()}/qtum/mac/bin/qtum-qt`;
          break;
        }
        default: {
          throw new Error(`Invalid execFile type: ${exec}`);
        }
      }
      break;
    }

    case 'win32': {
      if (arch === 'x64') {
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/win64/bin/qtumd.exe`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/win64/bin/qtum-qt.exe`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      } else { // x86 arch
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/win32/bin/qtumd.exe`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/win32/bin/qtum-qt.exe`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      }
      break;
    }

    case 'linux': {
      if (arch === 'x64') {
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/linux64/bin/qtumd`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/linux64/bin/qtum-qt`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      } else if (arch === 'x32') {
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/linux32/bin/qtumd`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/linux32/bin/qtum-qt`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      } else {
        throw new Error(`Linux arch ${arch} not supported`);
      }
      break;
    }

    default: {
      throw new Error('Operating system not supported');
    }
  }

  return path.replace('app.asar', 'app.asar.unpacked');
}

class Utils {
  static getQtumPath(exec) {
    let qtumPath;
    if (_.includes(process.argv, '--dev')) {
      qtumPath = getDevQtumPath(exec);
    } else {
      qtumPath = getProdQtumPath(exec);
    }
    return qtumPath;
  }

  /*
  * Returns the path where the data directory is, and also creates the directory if it doesn't exist.
  */
  static getDataDir() {
    const osDataDir = app.getPath('userData');
    let dataDir;
    const pathPrefix = isMainnet() ? 'mainnet' : 'testnet';
    if (_.indexOf(process.argv, '--dev') === -1) {
      const regex = RegExp(/(\d+)\.(\d+)\.(\d+)-(c\d+)-(d\d+)/g);
      const regexGroups = regex.exec(version);
      if (regexGroups === null) {
        throw new Error(`Invalid version number: ${version}`);
      }
      // Example: 0.6.5-c0-d1
      // c0 = contract version 0, d1 = db version 1
      const versionDir = `${regexGroups[4]}_${regexGroups[5]}`; // c0_d1

      // production
      dataDir = `${osDataDir}/${pathPrefix}/${versionDir}`;
    } else {
      // development
      dataDir = `${osDataDir}/${pathPrefix}/${DIR_DEV}`;
    }

    // Create data dir if needed
    fs.ensureDirSync(dataDir);

    return dataDir;
  }

  static getLogDir() {
    const osDataDir = app.getPath('userData');
    return `${osDataDir}/logs/${version}`;
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
