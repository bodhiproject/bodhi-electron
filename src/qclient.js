const { Qweb3 } = require('qweb3');

const { getQtumRPCAddress } = require('./config/config');

const QClient = (() => {
  let instance;

  function createInstance() {
    return new Qweb3(getQtumRPCAddress());
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
