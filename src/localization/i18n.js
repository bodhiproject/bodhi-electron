const _ = require('lodash');

const Utils = require('../utils/utils');
const logger = require('../utils/logger');
const locale = require('./locale.json');

class i18n {
  constructor() {
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

    logger.info(`Language: ${lang}`);
    this.lang = lang;
  }

  get(strName) {
    const str = locale[strName][this.lang];
    if (!_.isEmpty(str)) {
      return str;
    }
    return locale[strName]['en'];
  }
}

const instance = new i18n();
Object.freeze(instance);
module.exports = instance;
