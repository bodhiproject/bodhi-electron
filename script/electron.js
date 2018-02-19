const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

// Get output absolute path
let outputPath;
if (_.isEmpty(process.argv[2])) {
  throw new Exception('Output path must be defined');
} else {
   outputPath = path.dirname(process.argv[2]);
   outputPath = `${outputPath}/app`;
}

// Make dir if necessary
fs.ensureDirSync(outputPath);

// Copy files
const root = path.dirname(__dirname);
fs.copySync(`${root}/src`, `${outputPath}/src`);
fs.copySync(`${root}/node_modules`, `${outputPath}/node_modules`);
fs.copySync(`${root}/ui`, `${outputPath}/ui`);
fs.copySync(`${root}/.env`, `${outputPath}/.env`);
fs.copySync(`${root}/.npmrc`, `${outputPath}/.npmrc`);
fs.copySync(`${root}/main.js`, `${outputPath}/main.js`);
fs.copySync(`${root}/package-lock.json`, `${outputPath}/package-lock.json`);
fs.copySync(`${root}/package.json`, `${outputPath}/package.json`);
