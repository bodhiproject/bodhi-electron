const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const datastore = require('nedb-promise');

const Utils = require('../../utils/utils');
const logger = require('../../utils/logger');

async function appendDB(origin, dest) {
  logger.info(`To append ${origin} to ${dest}`);
  if (fs.existsSync(origin)) {
    try {
      const fileContent = fs.readFileSync(origin);
      fs.appendFileSync(dest, fileContent);
      logger.info(`Success append ${origin} to ${dest}`);
      await fs.unlink(origin);
    } catch (err) {
      logger.error(`DB migration error: ${err.msg}`);
      throw err;
    }
  }
}

async function migrateTxDB() {
  const d0OriginFile = `${Utils.getBaseDataDir()}/c0_d0/nedb/transactions.db`;
  const d1OriginFile = `${Utils.getBaseDataDir()}/c0_d1/nedb/transactions.db`;
  const destFile = `${Utils.getLocalCacheDataDir()}/nedb/transactions.db`;

  await appendDB(d0OriginFile, destFile);
  await appendDB(d1OriginFile, destFile);
}

module.exports = migrateTxDB;
