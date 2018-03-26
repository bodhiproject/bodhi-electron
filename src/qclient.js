const { Qweb3 } = require('qweb3');

const { Config } = require('./config/config');

const QClient = (() => {
  let instance;

  function createInstance() {
    return new Qweb3(Config.QTUM_RPC_ADDRESS);
  }

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

module.exports = QClient;
