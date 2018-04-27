require('dotenv').config();
const fs = require('fs-extra');
const moment = require('moment');
const winston = require('winston');
const Papertrail = require('winston-papertrail').Papertrail;

const Utils = require('./utils');
const { Config } = require('../config/config');

const LOG_DIR = Utils.getLogDir();

// Create log dir if needed
console.log(`Logs output: ${LOG_DIR}`);
fs.ensureDirSync(LOG_DIR);

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
    filename: `${LOG_DIR}/bodhiapp_${moment().format('YYYYMMDD_HHmmss')}.log`,
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
if (!Utils.isDevEnv()) {
  transports.push(new Papertrail({
    host: 'logs5.papertrailapp.com',
    port: 46145,
    level: 'debug',
    colorize: true,
    logFormat: (level, message) => `<<< ${level} >>> ${message}`,
  }));
}

const logger = new (winston.Logger)({
  transports,
  exitOnError: false,
});

const loglvl = process.env.loglvl || Config.DEFAULT_LOGLVL;
logger.level = loglvl;

module.exports = logger;
