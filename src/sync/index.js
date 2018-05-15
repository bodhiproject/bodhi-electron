/* eslint no-underscore-dangle: [2, { "allow": ["_eventName"] }] */

const _ = require('lodash');
const { Qweb3 } = require('qweb3');
const pubsub = require('../pubsub');
const logger = require('../utils/logger');
const moment = require('moment');
const BigNumber = require('bignumber.js');
const { getContractMetadata, isMainnet } = require('../config/config');
const { BLOCK_0_TIMESTAMP, SATOSHI_CONVERSION } = require('../constants');
const { db, DBHelper } = require('../db/nedb');
const updateTxDB = require('./update_tx');

const Topic = require('./models/topic');
const CentralizedOracle = require('./models/centralizedOracle');
const DecentralizedOracle = require('./models/decentralizedOracle');
const Vote = require('./models/vote');
const OracleResultSet = require('./models/oracleResultSet');
const FinalResultSet = require('./models/finalResultSet');
const bodhiToken = require('../api/bodhi_token');
const baseContract = require('../api/base_contract');
const wallet = require('../api/wallet');

const { getInstance } = require('../qclient');

const RPC_BATCH_SIZE = 10;
const BLOCK_BATCH_SIZE = 200;
const SYNC_THRESHOLD_SECS = 1200;

// hardcode sender address as it doesnt matter
let contractMetadata;
let senderAddress;

function sequentialLoop(iterations, process, exit) {
  let index = 0;
  let done = false;
  let shouldExit = false;

  const loop = {
    next() {
      if (done) {
        if (shouldExit && exit) {
          return exit();
        }
      }

      if (index < iterations) {
        index++;
        process(loop);
      } else {
        done = true;

        if (exit) {
          exit();
        }
      }
    },

    iteration() {
      return index - 1; // Return the loop number we're on
    },

    break(end) {
      done = true;
      shouldExit = end;
    },
  };
  loop.next();
  return loop;
}

const startSync = () => {
  contractMetadata = getContractMetadata();
  senderAddress = isMainnet() ? 'QaaaoExpFPj86rhzGabGQE1yDVfaQtLRm5' : 'qKjn4fStBaAtwGiwueJf9qFxgpbAvf1xAy';
  sync(db);
};

async function sync(db) {
  const removeHexPrefix = true;
  const topicsNeedBalanceUpdate = new Set();
  const oraclesNeedBalanceUpdate = new Set();

  const currentBlockCount = Math.max(0, await getInstance().getBlockCount());
  const currentBlockHash = await getInstance().getBlockHash(currentBlockCount);
  const currentBlockTime = (await getInstance().getBlock(currentBlockHash)).time;

  // Start sync based on last block written to DB
  let startBlock = contractMetadata.contractDeployedBlock;
  const blocks = await db.Blocks.cfind({}).sort({ blockNum: -1 }).limit(1).exec();
  if (blocks.length > 0) {
    startBlock = Math.max(blocks[0].blockNum + 1, startBlock);
  }

  const numOfIterations = Math.ceil((currentBlockCount - startBlock + 1) / BLOCK_BATCH_SIZE);

  sequentialLoop(
    numOfIterations,
    async (loop) => {
      await updateTxDB(db, currentBlockCount);
      logger.debug('Tx DB Updated');

      const endBlock = Math.min((startBlock + BLOCK_BATCH_SIZE) - 1, currentBlockCount);

      await syncTopicCreated(db, startBlock, endBlock, removeHexPrefix);
      logger.debug('Synced Topics');

      await Promise.all([
        syncCentralizedOracleCreated(db, startBlock, endBlock, removeHexPrefix),
        syncDecentralizedOracleCreated(db, startBlock, endBlock, removeHexPrefix, currentBlockTime),
      ]);
      logger.debug('Synced Oracles');

      await Promise.all([
        syncOracleResultVoted(db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate),
        syncOracleResultSet(db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate),
        syncFinalResultSet(db, startBlock, endBlock, removeHexPrefix, topicsNeedBalanceUpdate),
      ]);
      logger.debug('Synced Result Set');

      const { insertBlockPromises, endBlockTime } = await getInsertBlockPromises(db, startBlock, endBlock);
      await Promise.all(insertBlockPromises);
      logger.debug('Inserted Blocks');

      startBlock = endBlock + 1;
      loop.next();
    },
    async () => {
      logger.debug('Updating Topic and Oracle balances');
      const oracleAddressBatches = _.chunk(Array.from(oraclesNeedBalanceUpdate), RPC_BATCH_SIZE);
      // execute rpc batch by batch
      sequentialLoop(oracleAddressBatches.length, async (loop) => {
        const oracleIteration = loop.iteration();
        await Promise.all(oracleAddressBatches[oracleIteration].map(async (oracleAddress) => {
          await updateOracleBalance(oracleAddress, topicsNeedBalanceUpdate, db);
        }));

        // Oracle balance update completed
        if (oracleIteration === oracleAddressBatches.length - 1) {
        // two rpc call per topic balance so batch_size = RPC_BATCH_SIZE/2
          const topicAddressBatches = _.chunk(Array.from(topicsNeedBalanceUpdate), Math.floor(RPC_BATCH_SIZE / 2));
          sequentialLoop(topicAddressBatches.length, async (topicLoop) => {
            const topicIteration = topicLoop.iteration();
            await Promise.all(topicAddressBatches[topicIteration].map(async (topicAddress) => {
              await updateTopicBalance(topicAddress, db);
            }));
            topicLoop.next();
          }, () => {
            logger.debug('Updated Topic and Oracle balances');
            loop.next();
          });
        } else {
          // Process next Oracle batch
          loop.next();
        }
      }, async () => {
        logger.debug('Updating Oracles Passed End Times');
        await updateOraclesPassedEndTime(currentBlockTime, db);
        // must ensure updateCentralizedOraclesPassedResultSetEndBlock after updateOraclesPassedEndBlock
        await updateCOraclesPassedResultSetEndTime(currentBlockTime, db);

        if (numOfIterations > 0) {
          sendSyncInfo(
            currentBlockCount,
            currentBlockTime,
            await calculateSyncPercent(currentBlockCount, currentBlockTime),
            await getAddressBalances(),
          );
        }

        // nedb doesnt require close db, leave the comment as a reminder
        // await db.Connection.close();
        logger.debug('sleep');
        setTimeout(startSync, 5000);
      });
    },
  );
}

async function syncTopicCreated(db, startBlock, endBlock, removeHexPrefix) {
  let result;
  try {
    result = await getInstance().searchLogs(
      startBlock, endBlock, contractMetadata.EventFactory.address,
      [contractMetadata.EventFactory.TopicCreated], contractMetadata, removeHexPrefix,
    );
    logger.debug('searchlog TopicCreated');
  } catch (err) {
    logger.error(`ERROR: ${err.message}`);
    return;
  }

  logger.debug(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from TopicCreated`);
  const createTopicPromises = [];

  _.forEach(result, (event, index) => {
    const blockNum = event.blockNumber;
    const txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if (rawLog._eventName === 'TopicCreated') {
        const insertTopicDB = new Promise(async (resolve) => {
          try {
            const topic = new Topic(blockNum, txid, rawLog).translate();

            // Update existing mutated Topic or insert new
            if (await DBHelper.getCount(db.Topics, { txid }) > 0) {
              DBHelper.updateTopicByQuery(db.Topics, { txid }, topic);
            } else {
              DBHelper.insertTopic(db.Topics, topic);
            }

            resolve();
          } catch (err) {
            logger.error(`ERROR: ${err.message}`);
            resolve();
          }
        });

        createTopicPromises.push(insertTopicDB);
      }
    });
  });

  await Promise.all(createTopicPromises);
}

async function syncCentralizedOracleCreated(db, startBlock, endBlock, removeHexPrefix) {
  let result;
  try {
    result = await getInstance().searchLogs(
      startBlock, endBlock, contractMetadata.EventFactory.address,
      [contractMetadata.OracleFactory.CentralizedOracleCreated], contractMetadata, removeHexPrefix,
    );
    logger.debug('searchlog CentralizedOracleCreated');
  } catch (err) {
    logger.error(`${err.message}`);
    return;
  }

  logger.debug(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from CentralizedOracleCreated`);
  const createCentralizedOraclePromises = [];

  _.forEach(result, (event, index) => {
    const blockNum = event.blockNumber;
    const txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if (rawLog._eventName === 'CentralizedOracleCreated') {
        const insertOracleDB = new Promise(async (resolve) => {
          try {
            const centralOracle = new CentralizedOracle(blockNum, txid, rawLog).translate();
            const topic = await DBHelper.findOne(db.Topics, { address: centralOracle.topicAddress }, ['name', 'options']);

            centralOracle.name = topic.name;
            centralOracle.options = topic.options;

            // Update existing mutated Oracle or insert new
            if (await DBHelper.getCount(db.Oracles, { txid }) > 0) {
              DBHelper.updateOracleByQuery(db.Oracles, { txid }, centralOracle);
            } else {
              DBHelper.insertOracle(db.Oracles, centralOracle);
            }

            resolve();
          } catch (err) {
            logger.error(`${err.message}`);
            resolve();
          }
        });

        createCentralizedOraclePromises.push(insertOracleDB);
      }
    });
  });

  await Promise.all(createCentralizedOraclePromises);
}

async function syncDecentralizedOracleCreated(db, startBlock, endBlock, removeHexPrefix, currentBlockTime) {
  let result;
  try {
    result = await getInstance().searchLogs(
      startBlock, endBlock, [], contractMetadata.OracleFactory.DecentralizedOracleCreated,
      contractMetadata, removeHexPrefix,
    );
    logger.debug('searchlog DecentralizedOracleCreated');
  } catch (err) {
    logger.error(`${err.message}`);
    return;
  }

  logger.debug(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from DecentralizedOracleCreated`);
  const createDecentralizedOraclePromises = [];

  _.forEach(result, (event, index) => {
    const blockNum = event.blockNumber;
    const txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if (rawLog._eventName === 'DecentralizedOracleCreated') {
        const insertOracleDB = new Promise(async (resolve) => {
          try {
            const decentralOracle = new DecentralizedOracle(blockNum, txid, rawLog).translate();
            const topic = await DBHelper.findOne(
              db.Topics, { address: decentralOracle.topicAddress },
              ['name', 'options'],
            );

            decentralOracle.name = topic.name;
            decentralOracle.options = topic.options;
            decentralOracle.startTime = currentBlockTime;

            await db.Oracles.insert(decentralOracle);
            resolve();
          } catch (err) {
            logger.error(`${err.message}`);
            resolve();
          }
        });
        createDecentralizedOraclePromises.push(insertOracleDB);
      }
    });
  });

  await Promise.all(createDecentralizedOraclePromises);
}

async function syncOracleResultVoted(db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate) {
  let result;
  try {
    result = await getInstance().searchLogs(
      startBlock, endBlock, [], contractMetadata.CentralizedOracle.OracleResultVoted,
      contractMetadata, removeHexPrefix,
    );
    logger.debug('searchlog OracleResultVoted');
  } catch (err) {
    logger.error(`${err.message}`);
    return;
  }

  logger.debug(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from OracleResultVoted`);
  const createOracleResultVotedPromises = [];

  _.forEach(result, (event, index) => {
    const blockNum = event.blockNumber;
    const txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if (rawLog._eventName === 'OracleResultVoted') {
        const insertVoteDB = new Promise(async (resolve) => {
          try {
            const vote = new Vote(blockNum, txid, rawLog).translate();

            // Add topicAddress to vote obj
            const oracle = await DBHelper.findOne(db.Oracles, { address: vote.oracleAddress }, ['topicAddress']);
            if (oracle) {
              vote.topicAddress = oracle.topicAddress;
            }

            await db.Votes.insert(vote);

            oraclesNeedBalanceUpdate.add(vote.oracleAddress);
            resolve();
          } catch (err) {
            logger.error(`${err.message}`);
            resolve();
          }
        });

        createOracleResultVotedPromises.push(insertVoteDB);
      }
    });
  });

  await Promise.all(createOracleResultVotedPromises);
}

async function syncOracleResultSet(db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate) {
  let result;
  try {
    result = await getInstance().searchLogs(
      startBlock, endBlock, [], contractMetadata.CentralizedOracle.OracleResultSet, contractMetadata,
      removeHexPrefix,
    );
    logger.debug('searchlog OracleResultSet');
  } catch (err) {
    logger.error(`${err.message}`);
    return;
  }

  logger.debug(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from OracleResultSet`);
  const updateOracleResultSetPromises = [];

  _.forEach(result, (event, index) => {
    _.forEachRight(event.log, (rawLog) => {
      if (rawLog._eventName === 'OracleResultSet') {
        const updateOracleResult = new Promise(async (resolve) => {
          try {
            const oracleResult = new OracleResultSet(rawLog).translate();

            await db.Oracles.update(
              { address: oracleResult.oracleAddress },
              { $set: { resultIdx: oracleResult.resultIdx, status: 'PENDING' } }, {},
            );

            // safeguard to update balance, can be removed in the future
            oraclesNeedBalanceUpdate.add(oracleResult.oracleAddress);
            resolve();
          } catch (err) {
            logger.error(`${err.message}`);
            resolve();
          }
        });

        updateOracleResultSetPromises.push(updateOracleResult);
      }
    });
  });

  await Promise.all(updateOracleResultSetPromises);
}

async function syncFinalResultSet(db, startBlock, endBlock, removeHexPrefix, topicsNeedBalanceUpdate) {
  let result;
  try {
    result = await getInstance().searchLogs(
      startBlock, endBlock, [], contractMetadata.TopicEvent.FinalResultSet, contractMetadata,
      removeHexPrefix,
    );
    logger.debug('searchlog FinalResultSet');
  } catch (err) {
    logger.error(`${err.message}`);
    return;
  }

  logger.debug(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from FinalResultSet`);
  const updateFinalResultSetPromises = [];

  _.forEach(result, (event, index) => {
    _.forEachRight(event.log, (rawLog) => {
      if (rawLog._eventName === 'FinalResultSet') {
        const updateFinalResultSet = new Promise(async (resolve) => {
          try {
            const topicResult = new FinalResultSet(rawLog).translate();

            await db.Topics.update(
              { address: topicResult.topicAddress },
              { $set: { resultIdx: topicResult.resultIdx, status: 'WITHDRAW' } },
            );

            await db.Oracles.update(
              { topicAddress: topicResult.topicAddress },
              { $set: { status: 'WITHDRAW' } }, { multi: true },
            );

            // safeguard to update balance, can be removed in the future
            topicsNeedBalanceUpdate.add(topicResult.topicAddress);

            resolve();
          } catch (err) {
            logger.error(`${err.message}`);
            resolve();
          }
        });

        updateFinalResultSetPromises.push(updateFinalResultSet);
      }
    });
  });

  await Promise.all(updateFinalResultSetPromises);
}

// Gets all promises for new blocks to insert
async function getInsertBlockPromises(db, startBlock, endBlock) {
  let blockHash;
  let blockTime;
  const insertBlockPromises = [];

  for (let i = startBlock; i <= endBlock; i++) {
    try {
      blockHash = await getInstance().getBlockHash(i);
      blockTime = (await getInstance().getBlock(blockHash)).time;
    } catch (err) {
      logger.error(err);
    }

    insertBlockPromises.push(new Promise(async (resolve) => {
      try {
        await db.Blocks.insert({
          _id: i,
          blockNum: i,
          blockTime,
        });
      } catch (err) {
        logger.error(err);
      }
      resolve();
    }));
  }

  return { insertBlockPromises, endBlockTime: blockTime };
}

async function peerHighestSyncedHeader() {
  let peerBlockHeader = null;
  try {
    const res = await getInstance().getPeerInfo();
    _.each(res, (nodeInfo) => {
      if (_.isNumber(nodeInfo.synced_headers) && nodeInfo.synced_headers !== -1) {
        peerBlockHeader = Math.max(nodeInfo.synced_headers, peerBlockHeader);
      }
    });
  } catch (err) {
    logger.error(`Error calling getPeerInfo: ${err.message}`);
    return null;
  }

  return peerBlockHeader;
}

async function calculateSyncPercent(blockCount, blockTime) {
  const peerBlockHeader = await peerHighestSyncedHeader();
  if (_.isNull(peerBlockHeader)) {
    // estimate by blockTime
    let syncPercent = 100;
    const timestampNow = moment().unix();
    // if blockTime is 20 min behind, we are not fully synced
    if (blockTime < timestampNow - SYNC_THRESHOLD_SECS) {
      syncPercent = Math.floor((blockTime - BLOCK_0_TIMESTAMP) / (timestampNow - BLOCK_0_TIMESTAMP) * 100);
    }
    return syncPercent;
  }

  return Math.floor(blockCount / peerBlockHeader * 100);
}

// Send syncInfo subscription
function sendSyncInfo(syncBlockNum, syncBlockTime, syncPercent, addressBalances) {
  pubsub.publish('onSyncInfo', {
    onSyncInfo: {
      syncBlockNum,
      syncBlockTime,
      syncPercent,
      addressBalances,
    },
  });
}

async function updateOracleBalance(oracleAddress, topicSet, db) {
  // Find Oracle
  let oracle;
  try {
    oracle = await DBHelper.findOne(db.Oracles, { address: oracleAddress });
    if (!oracle) {
      logger.error(`find 0 oracle ${oracleAddress} in db to update`);
      return;
    }
  } catch (err) {
    logger.error(`updateOracleBalance: ${err.message}`);
    return;
  }

  // related topic should be updated
  topicSet.add(oracle.topicAddress);

  // Get balances
  let amounts;
  if (oracle.token === 'QTUM') {
    // Centralized Oracle
    try {
      const res = await baseContract.getTotalBets({
        contractAddress: oracleAddress,
        senderAddress,
      });
      amounts = res[0];
    } catch (err) {
      logger.error(`Oracle.getTotalBets: ${err.message}`);
    }
  } else {
    // DecentralizedOracle
    try {
      const res = await baseContract.getTotalVotes({
        contractAddress: oracleAddress,
        senderAddress,
      });
      amounts = res[0];
    } catch (err) {
      logger.error(`Oracle.getTotalVotes: ${err.message}`);
    }
  }

  // Update DB
  try {
    await db.Oracles.update({ address: oracleAddress }, { $set: { amounts } });
  } catch (err) {
    logger.error(`Update Oracle balances ${oracleAddress}: ${err.message}`);
  }
}

async function updateTopicBalance(topicAddress, db) {
  // Find Topic
  let topic;
  try {
    topic = await DBHelper.findOne(db.Topics, { address: topicAddress });
    if (!topic) {
      logger.error(`find 0 topic ${topicAddress} in db to update`);
      return;
    }
  } catch (err) {
    logger.error(`updateTopicBalance: ${err.message}`);
    return;
  }

  // Get balances
  let totalBets;
  try {
    const res = await baseContract.getTotalBets({
      contractAddress: topicAddress,
      senderAddress,
    });
    totalBets = res[0];
  } catch (err) {
    logger.error(`Topic.getTotalBets: ${err.message}`);
  }

  let totalVotes;
  try {
    const res = await baseContract.getTotalVotes({
      contractAddress: topicAddress,
      senderAddress,
    });
    totalVotes = res[0];
  } catch (err) {
    logger.error(`Topic.getTotalVotes: ${err.message}`);
  }

  // Update DB
  try {
    await db.Topics.update(
      { address: topicAddress },
      { $set: { qtumAmount: totalBets, botAmount: totalVotes } },
    );
  } catch (err) {
    logger.error(`Update Topic balances ${topicAddress}: ${err.message}`);
  }
}

// all central & decentral oracles with VOTING status and endTime less than currentBlockTime
async function updateOraclesPassedEndTime(currentBlockTime, db) {
  try {
    await db.Oracles.update(
      { endTime: { $lt: currentBlockTime }, status: 'VOTING' },
      { $set: { status: 'WAITRESULT' } },
      { multi: true },
    );
    logger.debug('Updated Oracles Passed End Time');
  } catch (err) {
    logger.error(`updateOraclesPassedEndTime ${err.message}`);
  }
}

// central oracles with WAITRESULT status and resultSetEndTime less than currentBlockTime
async function updateCOraclesPassedResultSetEndTime(currentBlockTime, db) {
  try {
    await db.Oracles.update(
      { resultSetEndTime: { $lt: currentBlockTime }, token: 'QTUM', status: 'WAITRESULT' },
      { $set: { status: 'OPENRESULTSET' } }, { multi: true },
    );
    logger.debug('Updated COracles Passed Result Set End Time');
  } catch (err) {
    logger.error(`updateCOraclesPassedResultSetEndTime ${err.message}`);
  }
}

async function getAddressBalances() {
  const addressObjs = [];
  const addressList = [];
  try {
    const res = await getInstance().listAddressGroupings();
    // grouping: [["qNh8krU54KBemhzX4zWG9h3WGpuCNYmeBd", 0.01], ["qNh8krU54KBemhzX4zWG9h3WGpuCNYmeBd", 0.02]], [...]
    _.each(res, (grouping) => {
      // addressArrItem: ["qNh8krU54KBemhzX4zWG9h3WGpuCNYmeBd", 0.08164600]
      _.each(grouping, (addressArrItem) => {
        addressObjs.push({
          address: addressArrItem[0],
          qtum: new BigNumber(addressArrItem[1]).multipliedBy(SATOSHI_CONVERSION).toString(10),
        });
        addressList.push(addressArrItem[0]);
      });
    });
  } catch (err) {
    logger.error(`listAddressGroupings: ${err.message}`);
  }

  const addressBatches = _.chunk(addressList, RPC_BATCH_SIZE);
  await new Promise(async (resolve) => {
    sequentialLoop(addressBatches.length, async (loop) => {
      const getBotBalancePromises = [];

      _.map(addressBatches[loop.iteration()], async (address) => {
        const getBotBalancePromise = new Promise(async (resolve) => {
          let botBalance = new BigNumber(0);

          // Get BOT balance
          try {
            const resp = await bodhiToken.balanceOf({
              owner: address,
              senderAddress: address,
            });

            botBalance = resp.balance;
          } catch (err) {
            logger.error(`BalanceOf ${address}: ${err.message}`);
            botBalance = '0';
          }

          // Update BOT balance for address
          const found = _.find(addressObjs, { address });
          found.bot = botBalance.toString(10);

          resolve();
        });

        getBotBalancePromises.push(getBotBalancePromise);
      });

      await Promise.all(getBotBalancePromises);
      loop.next();
    }, () => {
      resolve();
    });
  });

  // Add default address with zero balances if no address was used before
  if (_.isEmpty(addressObjs)) {
    const address = await wallet.getAccountAddress({ accountName: '' });
    addressObjs.push({
      address,
      qtum: '0',
      bot: '0',
    });
  }

  return addressObjs;
}

module.exports = {
  startSync,
  calculateSyncPercent,
  getAddressBalances,
};
