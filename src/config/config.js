const _ = require('lodash');

const mainnettMetadata = require('./mainnet/contract_metadata');
const testnetMetadata = require('./testnet/contract_metadata');

const config = {
  HOSTNAME: '127.0.0.1',
  PORT: 5555,
  QTUM_RPC_ADDRESS: 'http://bodhi:bodhi@localhost:13889',
  DEFAULT_LOGLVL: 'info',
};

/*
* Gets the smart contract metadata based on version and environment.
* @param versionNum {Number} The version number of the contracts to get, ie. 0, 1, 2.
* @param testnet {Boolean} Whether on testnet env or not.
* @return {Object} The contract metadata.
*/
function getContractMetadata(versionNum, testnet = true) {
  if (!_.isNumber(versionNum)) {
    throw new Error('Must supply a version number');
  }

  if (testnet) {
    return testnetMetadata.versionNum;
  } else {
    return mainnet.versionNum;
  }
}

module.exports = config;
