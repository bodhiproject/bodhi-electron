const _ = require('lodash');
const utils = require('../../qweb3.js/src/utils');

class CentralizedOracle {
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

    this.contractAddress = this.rawLog['_contractAddress'];
    this.oracle = this.rawLog['_oracle'];
    this.eventAddress = this.rawLog['_eventAddress'];
    this.numOfResults = this.rawLog['_numOfResults'].toNumber();
    this.bettingEndBlock = this.rawLog['_bettingEndBlock'].toNumber();
    this.resultSettingEndBlock = this.rawLog['_resultSettingEndBlock'].toNumber();
    this.consensusThreshold = this.rawLog['_consensusThreshold'].toNumber();
  }

  translate() {
    let optionIdxs = _.times()
    return {
      address: this.oracle,
      creatorAddress: this.creator,
      topicAddress:this.eventAddress,
      status: 'Voting',
      token: 'qtum',
      name: this.name,
      options: this.eventResultNames,
      optionIdxs: new Array(this.numOfResults).map(function (x, i) {return i}),
      amounts: _.fill(Array(this.numOfResults), 0),
      resultIdx: null,
      blockNum: this.blockNum,
      endBlock: this.bettingEndBlock
    }
  }
}

module.exports = CentralizedOracle;