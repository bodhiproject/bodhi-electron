const i18n_module = require('i18n-nodejs');

const Utils = require('../utils/utils');
const logger = require('../utils/logger');

const i18n = (() => {
  let instance;

  function createInstance() {
    // Set locale based on OS language
    let lang = 'en';
    const osLang = Utils.getOsLanguage();
    if (osLang) {
      if (osLang.includes('en')) {
        lang = 'en';
      } else if (osLang.includes('zh')) {
        lang = 'zh';
      }
    }

    logger.info(`Language: ${lang}`)
    return new i18n_module(lang, './locale.json'); 
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

module.exports = i18n;
