require('dotenv').config();
var winston = require('winston');

var config = winston.config;
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: function() {
        return new Date().toISOString().slice(0,19); 
      },
      formatter: function(options) {
        return `${options.timestamp()} ${__filename} ${config.colorize(options.level, options.level.toUpperCase())} ${(options.message ? options.message : '')} ${(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' )}`;
      }
    }),
    new (winston.transports.File)({
      filename: `${__dirname}/../logs/${new Date().toISOString().slice(0,10)}.log'`, 
    })
  ]
});
const loglvl = process.env.loglvl || 'info';
logger.level = loglvl;

module.exports = logger;