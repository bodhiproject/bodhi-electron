const _ = require('lodash');
const utils = require('../../qweb3.js/src/utils');

class Vote {
  constructor(blockNum, rawLog) {

    if (!_.isEmpty(rawLog)) {
      this.rawLog = rawLog;
      this.blockNum = blockNum;
      this.decode();
    }
  }

  decode() {
    let nameHex = _.reduce(this.rawLog['_name'], (hexStr, value) => {
      let valStr = value;
      if (valStr.indexOf('0x') === 0) {
          valStr = valStr.slice(2);
        }
        return hexStr += valStr;
      }, '');
    this.name = _.trimEnd(utils.toAscii(nameHex), '\u0000');

    let intermedia = _.map(this.rawLog['_eventResultNames'], (item) => _.trimEnd(utils.toAscii(item), '\u0000'));
    this.eventResultNames = _.filter(intermedia, item => !!item);

    this.oracleAddress = this.rawLog['_oracleAddress'];
    this.participant = this.rawLog['_participant'];
    this.resultIndex = this.rawLog['_resultIndex'].toNumber();
    this.votedAmount = this.rawLog['_votedAmount'].toNumber();

  }

  translate() {
    return {
      voterAddress: this.creavoterAddresstor,
      oracleAddress: this.oracleAddress,
      optionIdx: this.resultIndex,
      amount: this.votedAmount,
      blockNum: this.blockNum,
    }
  }
}

module.exports = Vote;