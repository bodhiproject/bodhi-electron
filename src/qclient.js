const { Qweb3 } = require('qweb3');

const { getQtumRpcAddress } = require('./config/config');

const QClient = (() => {
  let instance;

  function createInstance() {
    return new Qweb3(getQtumRpcAddress());
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
