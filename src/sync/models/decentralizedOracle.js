/* eslint no-underscore-dangle: 0 */

const _ = require('lodash');
const Web3Utils = require('web3-utils');

class DecentralizedOracle {
  constructor(blockNum, txid, rawLog) {
    if (!_.isEmpty(rawLog)) {
      this.blockNum = blockNum;
      this.txid = txid;
      this.rawLog = rawLog;
      this.decode();
    }
  }

  decode() {
    this.version = this.rawLog._version.toNumber();
    this.contractAddress = this.rawLog._contractAddress;
    this.eventAddress = this.rawLog._eventAddress;
    this.numOfResults = this.rawLog._numOfResults.toNumber();
    this.lastResultIndex = this.rawLog._lastResultIndex.toNumber();
    this.arbitrationEndTime = this.rawLog._arbitrationEndTime.toNumber();
    this.consensusThreshold = Web3Utils.hexToNumberString(this.rawLog._consensusThreshold);
  }

  translate() {
    const optionIdxs = Array.from(Array(this.numOfResults).keys());
    _.remove(optionIdxs, num => num === this.lastResultIndex);

    return {
      txid: this.txid,
      version: this.version,
      address: this.contractAddress,
      topicAddress: this.eventAddress,
      status: 'VOTING',
      token: 'BOT',
      name: this.name,
      options: this.options,
      optionIdxs,
      amounts: _.fill(Array(this.numOfResults), '0'),
      resultIdx: null,
      blockNum: this.blockNum,
      startTime: 0,
      endTime: this.arbitrationEndTime,
      consensusThreshold: this.consensusThreshold,
    };
  }
}

module.exports = DecentralizedOracle;
