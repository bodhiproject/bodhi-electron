const _ = require('lodash');
const { app } = require('electron');

const Utils = require('../utils/utils');
const logger = require('../utils/logger');
const locale = require('./locale.json');

class i18n {
  constructor() {
    // Set locale based on OS language
    let lang = 'zh';
    const osLang = app.getLocale();
    if (osLang) {
      if (osLang.startsWith('en')) {
        lang = 'en';
      } else if (osLang.startsWith('zh')) {
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

    // Could not find translated string, default to English
    return locale[strName].en;
  }
}

const instance = new i18n();
Object.freeze(instance);
module.exports = instance;
