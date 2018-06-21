const _ = require('lodash');
const { Constants, Utils } = require('bodhi-server');

/*
* Gets the prod env qtum exec path.
* return {String} The full prod path for the exec file.
*/
const getProdQtumExecPath = () => {
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
  const path = `${app.getAppPath()}/node_modules/bodhi-server/qtum/${osFolder}/bin`;
  return path.replace('app.asar', 'app.asar.unpacked');
};

/*
* Returns the path for the Qtum binaries folder.
*/
const getQtumExecPath = () => {
  let qtumExecPath;
  if (Utils.isDevEnv()) {
    qtumExecPath = Utils.getDevQtumExecPath();
  } else {
    qtumExecPath = getProdQtumExecPath();
  }

  if (_.isEmpty(qtumExecPath)) {
    throw Error('qtumExecPath cannot be empty.');
  }
  return qtumExecPath;
};

module.exports = {
  getQtumExecPath,
};
