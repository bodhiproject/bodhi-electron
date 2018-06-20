const _ = require('lodash');

const { execFile } = require('../../server/src/constants');
const { isDevEnv, getDevQtumExecPath } = require('../../server/src/utils');

/*
* Gets the prod env qtum exec path.
* @param execFile {String} The exec file type needed to be returned.
* return {String} The full prod path for the exec file.
*/
const getProdQtumExecPath = () => {
  // if (exec !== execFile.QTUMD && exec !== execFile.QTUM_QT && exec !== execFile.QTUM_CLI) {
  //   throw Error(`Invalid execFile type: ${exec}`);
  // }

  const platform = process.platform;
  const arch = process.arch;
  let osFolder;

  switch (platform) {
    case 'darwin': {
      osFolder = 'mac';
      break;
    }
    case 'linux': {
      if (arch === 'x64') {
        osFolder = 'linux64';
      } else if (arch === 'x32') {
        osFolder = 'linux32';
      } else {
        throw Error(`Linux arch ${arch} not supported.`);
      }
      break;
    }
    case 'win32': {
      osFolder = arch === 'x64' ? 'win64' : 'win32';
      break;
    }
    default: {
      throw Error('Operating system not supported.');
    }
  }

  const { app } = require('electron');
  const path = `${app.getAppPath()}/server/qtum/${osFolder}/bin`;
  // let path;
  // if (platform === 'win32') {
  //   path = `${app.getAppPath()}/server/qtum/${osFolder}/bin/${exec}.exe`;
  // } else {
  //   path = `${app.getAppPath()}/server/qtum/${osFolder}/bin/${exec}`;
  // }

  return path.replace('app.asar', 'app.asar.unpacked');
};

/*
* Returns the path for the Qtum binaries folder.
*/
const getQtumExecPath = () => {
  let qtumExecPath;
  if (isDevEnv()) {
    qtumExecPath = getDevQtumExecPath();
  } else {
    qtumExecPath = getProdQtumExecPath();
  }

  if (_.isEmpty(qtumExecPath)) {
    throw Error(`qtumExecPath cannot be empty.`);
  }
  return qtumExecPath;
};

module.exports = {
  getQtumExecPath,
};
