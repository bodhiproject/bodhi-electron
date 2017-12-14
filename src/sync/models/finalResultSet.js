const _ = require('lodash');
const utils = require('../../qweb3.js/src/utils');

class FinalResultSet {
  constructor(blockNum, rawLog) {

    if (!_.isEmpty(rawLog)) {
      this.rawLog = rawLog;
      this.blockNum = blockNum;
      this.decode();
    }
  }

  decode() {
    this.address = this.rawLog['_address']
    this.finalResultIndex = this.rawLog['_finalResultIndex'].toNumber();
  }

  translate() {
    return {
      topicAddress: this.address,
      resultIdx: this.finalResultIndex,
    }
  }
}

module.exports = FinalResultSet;