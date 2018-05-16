require('dotenv').config();
const fs = require('fs-extra');
const moment = require('moment');
const winston = require('winston');
const Papertrail = require('winston-papertrail').Papertrail;
const _ = require('lodash');

const { isDevEnv } = require('./utils');
const { Config } = require('../config/config');

let logger;

function initLogger() {
  // Don't initialize logger for tests
  if (!_.includes(process.argv, '--test')) {
    const logDir = require('./utils').getLogDir();
    fs.ensureDirSync(logDir); // Create log dir if needed

    const winstonCfg = winston.config;
    const transports = [
      new (winston.transports.Console)({
        timestamp() {
          return moment().format('YYYY-MM-DD HH:mm:ss');
        },
        formatter(options) {
          return `${options.timestamp()} ${winstonCfg.colorize(options.level, options.level.toUpperCase())} ${(options.message ? options.message : '')} ${(options.meta && Object.keys(options.meta).length ? `\n\t${JSON.stringify(options.meta)}` : '')}`;
        },
      }),
      new (winston.transports.File)({
        filename: `${logDir}/bodhiapp_${moment().format('YYYYMMDD_HHmmss')}.log`,
        timestamp() {
          return moment().format('YYYY-MM-DD HH:mm:ss');
        },
        formatter(options) {
          return `${options.timestamp()} ${winstonCfg.colorize(options.level, options.level.toUpperCase())} ${(options.message ? options.message : '')} ${(options.meta && Object.keys(options.meta).length ? `\n\t${JSON.stringify(options.meta)}` : '')}`;
        },
        json: false,
      }),
    ];

    // add Papertrail remote logging if prod env
    if (!isDevEnv()) {
      transports.push(new Papertrail({
        host: 'logs5.papertrailapp.com',
        port: 46145,
        level: 'debug',
        colorize: true,
        logFormat: (level, message) => `<<< ${level} >>> ${message}`,
      }));
    }

    logger = new (winston.Logger)({ transports, exitOnError: false });
    logger.level = process.env.loglvl || Config.DEFAULT_LOGLVL;
    logger.info(`Logs path: ${logDir}`);
  }
}

function getLogger() {
  if (!logger) {
    initLogger();
  }
  return logger;
}

module.exports = {
  getLogger,
};
