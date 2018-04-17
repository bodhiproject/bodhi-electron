const _ = require('lodash');

const { blockchainEnv } = require('../constants');
const mainnetMetadata = require('./mainnet/contract_metadata');
const testnetMetadata = require('./testnet/contract_metadata');

const EXPLORER_TESTNET = 'https://testnet.qtum.org';
const EXPLORER_MAINNET = 'https://explorer.qtum.org';

const RPC_ADDRESS_TESTNET = 'http://bodhi:bodhi@localhost:13889';
const RPC_ADDRESS_MAINNET = 'http://bodhi:bodhi@localhost:3889';

const Config = {
  HOSTNAME: '127.0.0.1',
  PORT: 5555,
  DEFAULT_LOGLVL: 'info',
  CONTRACT_VERSION_NUM: 0,
  TRANSFER_MIN_CONFIRMATIONS: 1,
  DEFAULT_GAS_LIMIT: 250000,
  DEFAULT_GAS_PRICE: 0.0000004,
  CREATE_DORACLE_GAS_LIMIT: 1500000,
};

// Qtumd environment var: testnet/mainnet
let qtumEnv;

const setQtumEnv = (env) => {
  qtumEnv = env;
};

const getQtumEnv = () => qtumEnv;

const isMainnet = () => qtumEnv === blockchainEnv.MAINNET;

const getQtumRPCAddress = () => (isMainnet() ? RPC_ADDRESS_MAINNET : RPC_ADDRESS_TESTNET);

const getQtumExplorerUrl = () => (isMainnet() ? EXPLORER_MAINNET : EXPLORER_TESTNET);

/*
* Gets the smart contract metadata based on version and environment.
* @param versionNum {Number} The version number of the contracts to get, ie. 0, 1, 2.
* @param testnet {Boolean} Whether on testnet env or not.
* @return {Object} The contract metadata.
*/
function getContractMetadata(versionNum = Config.CONTRACT_VERSION_NUM) {
  if (!_.isNumber(versionNum)) {
    throw new Error('Must supply a version number');
  }

  if (qtumEnv === blockchainEnv.TESTNET) {
    return testnetMetadata[versionNum];
  }
  return mainnetMetadata[versionNum];
}

module.exports = {
  Config,
  getQtumEnv,
  isMainnet,
  setQtumEnv,
  getQtumRPCAddress,
  getQtumExplorerUrl,
  getContractMetadata,
};
