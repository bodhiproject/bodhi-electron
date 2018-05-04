const _ = require('lodash');
const { Contract } = require('qweb3');

const { Config, getContractMetadata, getQtumRPCAddress } = require('../config/config');
const Utils = require('../utils/utils');

function getContract() {
  const metadata = getContractMetadata();
  return new Contract(getQtumRPCAddress(), metadata.EventFactory.address, metadata.EventFactory.abi);
}

const EventFactory = {
  async createTopic(args) {
    const {
      oracleAddress, // address
      eventName, // string
      resultNames, // string array
      bettingStartTime, // string: unix time
      bettingEndTime, // string: unix time
      resultSettingStartTime, // string: unix time
      resultSettingEndTime, // string: unix time
      senderAddress, // address
    } = args;

    if (_.isUndefined(oracleAddress)) {
      throw new TypeError('oracleAddress needs to be defined');
    }
    if (_.isUndefined(eventName)) {
      throw new TypeError('eventName needs to be defined');
    }
    if (_.isUndefined(resultNames)) {
      throw new TypeError('resultNames needs to be defined');
    }
    if (_.isUndefined(bettingStartTime)) {
      throw new TypeError('bettingStartTime needs to be defined');
    }
    if (_.isUndefined(bettingEndTime)) {
      throw new TypeError('bettingEndTime needs to be defined');
    }
    if (_.isUndefined(resultSettingStartTime)) {
      throw new TypeError('resultSettingStartTime needs to be defined');
    }
    if (_.isUndefined(resultSettingEndTime)) {
      throw new TypeError('resultSettingEndTime needs to be defined');
    }
    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    return getContract().send('createTopic', {
      methodArgs: [oracleAddress, eventName, resultNames, bettingStartTime, bettingEndTime, resultSettingStartTime,
        resultSettingEndTime],
      gasLimit: Config.CREATE_CORACLE_GAS_LIMIT,
      senderAddress,
    });
  },

  async version(args) {
    const {
      senderAddress, // address
    } = args;

    if (_.isUndefined(senderAddress)) {
      throw new TypeError('senderAddress needs to be defined');
    }

    const res = await getContract().call('version', {
      methodArgs: [],
      senderAddress,
    });
    res[0] = Utils.hexToDecimalString(res[0]);
    return res;
  },
};

module.exports = EventFactory;
