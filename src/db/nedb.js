const path = require('path');
const datastore = require('nedb-promise');

const Utils = require('../utils/utils');

const basePath = `${Utils.getDataDir()}/nedb`;
const topics = datastore({ filename: `${basePath}/topics.db`, autoload: true });
const oracles = datastore({ filename: `${basePath}/oracles.db`, autoload: true });
const votes = datastore({ filename: `${basePath}/votes.db`, autoload: true });
const blocks = datastore({ filename: `${basePath}/blocks.db`, autoload: true });
const transactions = datastore({ filename: `${basePath}/transactions.db`, autoload: true });

const dbPromises = [topics, oracles, votes, blocks, transactions];

module.exports = async () => {
  try {
    await Promise.all(dbPromises);
  } catch (err) {
    console.error(`DB load Error: ${err.message}`);
    return;
  }

  return {
    Topics: topics,
    Oracles: oracles,
    Votes: votes,
    Blocks: blocks,
    Transactions: transactions,
  };
};
