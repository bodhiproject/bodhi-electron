const fs = require('fs-extra');
const _ = require('lodash');
const { app } = require('electron');
const Web3Utils = require('web3-utils');

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

function isDevEnv() {
  return _.includes(process.argv, '--dev');
}

/*
* Converts a hex number to decimal string.
* @param input {String|Hex|BN} The hex number to convert.
*/
function hexToDecimalString(input) {
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

module.exports = {
  isDevEnv,
  hexToDecimalString,
  
  getQtumPath: (exec) => {
    let qtumPath;
    if (isDevEnv()) {
      qtumPath = getDevQtumPath(exec);
    } else {
      qtumPath = getProdQtumPath(exec);
    }
    return qtumPath;
  },

  /*
  * Returns the path where the data directory is, and also creates the directory if it doesn't exist.
  */
  getBaseDataDir: () => {
    const osDataDir = app.getPath('userData');
    const pathPrefix = isMainnet() ? 'mainnet' : 'testnet';
    let basePath = `${osDataDir}/${pathPrefix}`;
    if (isDevEnv()) {
      basePath += '/dev';
    }
    return basePath;
  }

  /*
  * Returns the path where the blockchain data directory is, and also creates the directory if it doesn't exist.
  */
  getBlockchainDataDir: () => {
    const basePath = this.getBaseDataDir();
    const regex = RegExp(/(\d+)\.(\d+)\.(\d+)-(c\d+)-(d\d+)/g);
    const regexGroups = regex.exec(version);
    if (regexGroups === null) {
      throw new Error(`Invalid version number: ${version}`);
    }

    // Example: 0.6.5-c0-d1
    // c0 = contract version 0, d1 = db version 1
    const versionDir = `${regexGroups[4]}_${regexGroups[5]}`; // c0_d1

    // production
    const dataDir = `${basePath}/${versionDir}/nedb`;

    // Create data dir if needed
    fs.ensureDirSync(dataDir);

    return dataDir;
  }

  /*
  * Returns the path where the local cache data (Transaction table) directory is, and also creates the directory if it doesn't exist.
  * The Local cache should exist regardless of version change, for now
  */
  getLocalCacheDataDir: () => {
    const dataDir = `${this.getBaseDataDir()}/local/nedb`;

    // Create data dir if needed
    fs.ensureDirSync(dataDir);

    return dataDir;
  },

  getLogDir: () => {
    const osDataDir = app.getPath('userData');
    return `${osDataDir}/logs/${version}`;
  },

  hexArrayToDecimalArray: (array) => {
    if (!array) {
      return undefined;
    }
    return _.map(array, item => hexToDecimalString(item));
  },

  isAllowanceEnough: async (owner, spender, amount) => {
    try {
      const res = await require('../api/bodhi_token').allowance({
        owner,
        spender,
        senderAddress: owner,
      });

      const allowance = Web3Utils.toBN(res.remaining);
      const amountBN = Web3Utils.toBN(amount);
      return allowance.gte(amountBN);
    } catch (err) {
      logger.error(`Error checking allowance: ${err.message}`);
      throw err;
    }
  },

  // Get correct gas limit determined if voting over consensus threshold or not
  getVotingGasLimit: async (oraclesDb, oracleAddress, voteOptionIdx, voteAmount) => {
    const oracle = await oraclesDb.findOne({ address: oracleAddress }, { consensusThreshold: 1, amounts: 1 });
    if (!oracle) {
      logger.error(`Could not find Oracle ${oracleAddress} in DB.`);
      throw new Error(`Could not find Oracle ${oracleAddress} in DB.`);
    }

    const threshold = Web3Utils.toBN(oracle.consensusThreshold);
    const currentTotal = Web3Utils.toBN(oracle.amounts[voteOptionIdx]);
    const maxVote = threshold.sub(currentTotal);
    return Web3Utils.toBN(voteAmount).gte(maxVote) ? Config.CREATE_DORACLE_GAS_LIMIT : Config.DEFAULT_GAS_LIMIT;
  },
};
