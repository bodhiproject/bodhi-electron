const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const MAC = 'mac';
const WIN64 = 'win64';
const WIN32 = 'win32';
const LINUX64 = 'linux64';
const LINUX32 = 'linux32';
const ACCEPTED_BUILDS = [MAC, WIN64, WIN32, LINUX64, LINUX32];

// Get build type
let build = process.argv[3];
if (_.isEmpty(build)) {
  throw new Exception('Build type must be defined');
} else if (!_.includes(ACCEPTED_BUILDS, build)) {
  throw new Exception('Build type unknown');
}

// Get output absolute path
let outputPath = process.argv[2];
if (_.isEmpty(outputPath)) {
  throw new Exception('Output path must be defined');
} else {
   // Strip trailing slash
   if (outputPath.substr(-1) === '/') {
    outputPath = outputPath.substr(0, outputPath.length - 1);
   }

   outputPath = `${outputPath}/${build}/app`
}

// Make all dirs if necessary
fs.ensureDirSync(outputPath);

// Remove all old files if existing
fs.emptyDirSync(outputPath);

// Copy files
console.log('Copying files to:', outputPath);
const root = path.dirname(__dirname);
fs.copySync(`${root}/src`, `${outputPath}/src`);
fs.copySync(`${root}/node_modules`, `${outputPath}/node_modules`);
fs.copySync(`${root}/ui`, `${outputPath}/ui`);
fs.copySync(`${root}/.env`, `${outputPath}/.env`);
fs.copySync(`${root}/.npmrc`, `${outputPath}/.npmrc`);
fs.copySync(`${root}/main.js`, `${outputPath}/main.js`);
fs.copySync(`${root}/package-lock.json`, `${outputPath}/package-lock.json`);
fs.copySync(`${root}/package.json`, `${outputPath}/package.json`);

switch (build) {
  case MAC:
  case LINUX64:
  case LINUX32: {
    fs.copySync(`${root}/qtum/${build}/bin/qtumd`, `${outputPath}/qtum/qtumd`);
    break;
  }
  case WIN64:
  case WIN32: {
    fs.copySync(`${root}/qtum/${build}/bin/qtumd.exe`, `${outputPath}/qtum/qtumd.exe`);
    break;
  }
  default: {
    break;
  }
}

console.log('Done');
