const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const { app } = require('electron');
const { version } = require('../../package.json');

const DIR_DEV = 'dev';

class Utils {
  /*
  * Returns the path where the data directory is, and also creates the directory if it doesn't exist.
<<<<<<< HEAD
=======
  *
>>>>>>> remove useless subscription and ensure chainBlockNum not null
  */
  static getDataDir() {
    let dataDir;
    if (_.indexOf(process.argv, '--dev') === -1) {
      // production
      dataDir = `${app.getPath('userData')}/${version}`;
    } else {
      // development
      dataDir = `${app.getPath('userData')}/${DIR_DEV}`;
    }

    // Create data dir if needed
    fs.ensureDirSync(dataDir);

    return dataDir;
  }
}

module.exports = Utils;
