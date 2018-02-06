require('dotenv').config();
const moment = require('moment');
const winston = require('winston');

var config = winston.config;
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return moment().format("YYYY-MM-DD HH:mm:ss")
      },
      formatter: function(options) {
        return `${options.timestamp()} ${__filename} ${config.colorize(options.level, options.level.toUpperCase())} ${(options.message ? options.message : '')} ${(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )}`;
      }
    }),
    new (winston.transports.File)({
      filename: `${__dirname}/../logs/${moment().format("YYYY-MM-DD")}.log`,
      timestamp: function() {
        return moment().format("YYYY-MM-DD HH:mm:ss")
      }, 
      formatter: function(options) {
        return `${options.timestamp()} ${__filename} ${config.colorize(options.level, options.level.toUpperCase())} ${(options.message ? options.message : '')} ${(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )}`;
      },
      json: false,
    })
  ],
  exitOnError: false
});
const loglvl = process.env.loglvl || 'info';
logger.level = loglvl;

module.exports = logger;