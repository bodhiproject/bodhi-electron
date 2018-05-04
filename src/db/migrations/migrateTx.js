const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const datastore = require('nedb-promise');

const Utils = require('../../utils/utils');
const logger = require('../../utils/logger');

async function appendDB(origin, dest) {
  if (fs.existsSync(origin)) {
    logger.info(`To append ${origin} to ${dest}`);
    try {
      const fileContent = fs.readFileSync(origin);
      fs.appendFileSync(dest, fileContent);
      logger.info(`Success append ${origin} to ${dest}`);
      await fs.rename(origin, `${origin}.old`);
      logger.info(`Rename ${origin} to ${origin}.old`);
    } catch (err) {
      logger.error(`DB migration error: ${err.msg}`);
      throw err;
    }
  }
}

async function migrateTxDB() {
  const d0OriginPath = `${Utils.getBaseDataDir()}/c0_d0/nedb/transactions.db`;
  const d1OriginPath = `${Utils.getBaseDataDir()}/c0_d1/nedb/transactions.db`;
  const destPath = `${Utils.getLocalCacheDataDir()}/nedb/transactions.db`;

  await appendDB(d0OriginPath, destPath);
  await appendDB(d1OriginPath, destPath);
}

module.exports = migrateTxDB;
