/* eslint no-underscore-dangle: 0 */

const _ = require('lodash');
const Decoder = require('qweb3').Decoder;
const Web3Utils = require('web3-utils');

class Vote {
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
    this.oracleAddress = this.rawLog._oracleAddress;
    this.participant = this.rawLog._participant;
    this.resultIndex = this.rawLog._resultIndex.toNumber();
    this.votedAmount = Web3Utils.hexToNumberString(this.rawLog._votedAmount);
  }

  translate() {
    return {
      txid: this.txid,
      version: this.version,
      voterAddress: this.participant,
      voterQAddress: Decoder.toQtumAddress(this.participant),
      topicAddress: '',
      oracleAddress: this.oracleAddress,
      optionIdx: this.resultIndex,
      amount: this.votedAmount,
      blockNum: this.blockNum,
    };
  }
}

module.exports = Vote;
