/* eslint no-underscore-dangle: 0 */

const _ = require('lodash');
const { Decoder, Utils } = require('qweb3');
const Web3Utils = require('web3-utils');

const { isMainnet } = require('../../config/config');

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
    this.token = Utils.toUtf8(this.rawLog._token);
  }

  translate() {
    return {
      txid: this.txid,
      version: this.version,
      voterAddress: this.participant,
      voterQAddress: Decoder.toQtumAddress(this.participant, isMainnet()),
      topicAddress: '',
      oracleAddress: this.oracleAddress,
      optionIdx: this.resultIndex,
      amount: this.votedAmount,
      token: this.token,
      blockNum: this.blockNum,
    };
  }
}

module.exports = Vote;
