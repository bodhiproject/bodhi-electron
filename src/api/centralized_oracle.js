const _ = require('lodash');
const { Contract } = require('qweb3');

const { Config, getContractMetadata, getQtumRPCAddress } = require('../config/config');

function getContract(contractAddress) {
  const metadata = getContractMetadata();
  return new Contract(getQtumRPCAddress(), contractAddress, metadata.CentralizedOracle.abi);
}

const CentralizedOracle = {
  async bet(args) {
    const {
      contractAddress, // address
      index, // number
      amount, // string: Satoshi
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(index)) {
      throw new TypeError('index needs to be defined');
    }
    if (_.isUndefined(amount)) {
      throw new TypeError('amount needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.send('bet', {
      methodArgs: [index],
      amount,
      senderAddress,
    });
  },

  async setResult(args) {
    const {
      contractAddress, // address
      resultIndex, // number
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(resultIndex)) {
      throw new TypeError('resultIndex needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.send('setResult', {
      methodArgs: [resultIndex],
      gasLimit: Config.CREATE_DORACLE_GAS_LIMIT,
      senderAddress,
    });
  },

  async oracle(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.call('oracle', {
      methodArgs: [],
      senderAddress,
    });
  },

  async bettingStartBlock(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.call('bettingStartBlock', {
      methodArgs: [],
      senderAddress,
    });
  },

  async bettingEndBlock(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.call('bettingEndBlock', {
      methodArgs: [],
      senderAddress,
    });
  },

  async resultSettingStartBlock(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.call('resultSettingStartBlock', {
      methodArgs: [],
      senderAddress,
    });
  },

  async resultSettingEndBlock(args) {
    const {
      contractAddress, // address
      senderAddress, // address
    } = args;

    if (_.isUndefined(contractAddress)) {
      throw new TypeError('contractAddress needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const contract = getContract(contractAddress);
    return contract.call('resultSettingEndBlock', {
      methodArgs: [],
      senderAddress,
    });
  },
};

module.exports = CentralizedOracle;
