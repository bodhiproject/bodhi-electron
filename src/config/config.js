const config = {
  QTUM_RPC_ADDRESS: 'http://bodhi:bodhi@localhost:13889',
  MONGO_URL: 'mongodb://localhost:27017/bodhiapi',
  LOG_PATH: `${__dirname}/../logs`,
  DEFAULT_LOGLVL: 'info',
};

module.exports = config;
