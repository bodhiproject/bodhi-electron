const _ = require('lodash');
const path = require('path');

class Utils {
  static getRootPath() {
    if (_.indexOf(process.argv, '--dev') === -1) {
      // ran without --dev flag (build version)
      return path.dirname(process.execPath);
    } else {
      // ran with --dev flag (dev version)
      return path.dirname(__dirname);
    }
  }
}

module.exports = Utils;
