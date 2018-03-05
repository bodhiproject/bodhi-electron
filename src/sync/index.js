/* eslint no-underscore-dangle: [2, { "allow": ["_eventName"] }] */

const _ = require('lodash');
const { Qweb3, Contract } = require('qweb3');
const pubsub = require('../pubsub');
const logger = require('../utils/logger');
const fetch = require('node-fetch');

const { Config, getContractMetadata } = require('../config/config');
const { connectDB, DBHelper } = require('../db/nedb');
const updateTxDB = require('./update_tx');

const Topic = require('./models/topic');
const CentralizedOracle = require('./models/centralizedOracle');
const DecentralizedOracle = require('./models/decentralizedOracle');
const Vote = require('./models/vote');
const OracleResultSet = require('./models/oracleResultSet');
const FinalResultSet = require('./models/finalResultSet');

const qclient = new Qweb3(Config.QTUM_RPC_ADDRESS);
const contractMetadata = getContractMetadata();

const rpcBatchSize = 20;
const batchSize = 200;
const contractDeployedBlockNum = contractMetadata.contractDeployedBlock;
const senderAddress = 'qKjn4fStBaAtwGiwueJf9qFxgpbAvf1xAy'; // hardcode sender address as it doesnt matter

const startSync = async () => {
  const db = await connectDB();
  sync(db);
  updateTxDB(db);
};

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

async function sync(db) {
  const removeHexPrefix = true;
  const topicsNeedBalanceUpdate = new Set();
  const oraclesNeedBalanceUpdate = new Set();

  const currentBlockCount = Math.max(0, await qclient.getBlockCount());
  const currentBlockHash = await qclient.getBlockHash(currentBlockCount);
  const currentBlockTime = (await qclient.getBlock(currentBlockHash)).time;

  // Start sync based on last block written to DB
  let startBlock = contractDeployedBlockNum;
  const blocks = await db.Blocks.cfind({}).sort({ blockNum: -1 }).limit(1).exec();
  if (blocks.length > 0) {
    startBlock = Math.max(blocks[0].blockNum + 1, startBlock);
  }

  // Get the latest block num based on Qtum master node via Insight API
  // Used to determine if local chain is fully synced
  let chainBlockNum = null;
  try {
    const resp = await fetch('https://testnet.qtum.org/insight-api/status?q=getInfo');
    const json = await resp.json();
    chainBlockNum = json.info.blocks;
  } catch (err) {
    logger.error(`Error GET https://testnet.qtum.org/insight-api/status?q=getInfo: ${err.message}`);
  }

  const numOfIterations = Math.ceil((currentBlockCount - startBlock + 1) / batchSize);

  sequentialLoop(
    numOfIterations,
    async (loop) => {
      const endBlock = Math.min((startBlock + batchSize) - 1, currentBlockCount);

      await syncTopicCreated(db, startBlock, endBlock, removeHexPrefix);
      logger.debug('Synced Topics');

      await Promise.all([
        syncCentralizedOracleCreated(db, startBlock, endBlock, removeHexPrefix),
        syncDecentralizedOracleCreated(db, startBlock, endBlock, removeHexPrefix, currentBlockTime),
        syncOracleResultVoted(db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate),
      ]);
      logger.debug('Synced Oracles');

      await Promise.all([
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
      const oracleAddressBatches = _.chunk(Array.from(oraclesNeedBalanceUpdate), rpcBatchSize);
      // execute rpc batch by batch
      sequentialLoop(oracleAddressBatches.length, async (loop) => {
        const oracleIteration = loop.iteration();
        logger.debug(`oracle batch: ${oracleIteration}`);
        await Promise.all(oracleAddressBatches[oracleIteration].map(async (oracleAddress) => {
          await updateOracleBalance(oracleAddress, topicsNeedBalanceUpdate, db);
        }));

        // Oracle balance update completed
        if (oracleIteration === oracleAddressBatches.length - 1) {
        // two rpc call per topic balance so batch_size = rpcBatchSize/2
          const topicAddressBatches = _.chunk(Array.from(topicsNeedBalanceUpdate), Math.floor(rpcBatchSize / 2));
          sequentialLoop(topicAddressBatches.length, async (topicLoop) => {
            const topicIteration = topicLoop.iteration();
            logger.debug(`topic batch: ${topicIteration}`);
            await Promise.all(topicAddressBatches[topicIteration].map(async (topicAddress) => {
              await updateTopicBalance(topicAddress, db);
            }));
            logger.debug('next topic batch');
            topicLoop.next();
          }, () => {
            logger.debug('Updated topics balance');
            loop.next();
          });
        } else {
          logger.debug('next oracle batch');
          loop.next();
        }
      }, async () => {
        await updateOraclesPassedEndTime(currentBlockTime, db);
        // must ensure updateCentralizedOraclesPassedResultSetEndBlock after updateOraclesPassedEndBlock
        await updateCentralizedOraclesPassedResultSetEndTime(currentBlockTime, db);

        if (_.isNil(chainBlockNum)) {
          logger.warn('chainBlockNum should not be null');
        } else if (numOfIterations > 0) {
          sendSyncInfo(currentBlockCount, currentBlockTime, chainBlockNum);
        }

        // nedb doesnt require close db, leave the comment as a reminder
        // await db.Connection.close();
        logger.debug('sleep');
        setTimeout(startSync, 5000);
      });
    },
  );
}

async function fetchNameOptionsFromTopic(db, address) {
  const topic = await db.Topics.findOne({ address }, { name: 1, options: 1 });
  if (!topic) {
    throw Error(`could not find Topic ${address} in db`);
  } else {
    return topic;
  }
}

async function syncTopicCreated(db, startBlock, endBlock, removeHexPrefix) {
  let result;
  try {
    result = await qclient.searchLogs(
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
            DBHelper.insertOrUpdateTopic(db.Topics, topic);
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
    result = await qclient.searchLogs(
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
            const topic = await fetchNameOptionsFromTopic(db, centralOracle.topicAddress);

            centralOracle.name = topic.name;
            centralOracle.options = topic.options;

            DBHelper.insertOrUpdateCOracle(db.Oracles, centralOracle);
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
    result = await qclient.searchLogs(
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
            const topic = await fetchNameOptionsFromTopic(db, decentralOracle.topicAddress);

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
    result = await qclient.searchLogs(
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
            oraclesNeedBalanceUpdate.add(vote.oracleAddress);

            await db.Votes.insert(vote);
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
    result = await qclient.searchLogs(
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
            // safeguard to update balance, can be removed in the future
            oraclesNeedBalanceUpdate.add(oracleResult.oracleAddress);

            await db.Oracles.update(
              { address: oracleResult.oracleAddress },
              { $set: { resultIdx: oracleResult.resultIdx, status: 'PENDING' } }, {},
            );
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
    result = await qclient.searchLogs(
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
            // safeguard to update balance, can be removed in the future
            topicsNeedBalanceUpdate.add(topicResult.topicAddress);

            await db.Topics.update(
              { address: topicResult.topicAddress },
              { $set: { resultIdx: topicResult.resultIdx, status: 'WITHDRAW' } },
            );

            await db.Oracles.update(
              { topicAddress: topicResult.topicAddress },
              { $set: { resultIdx: topicResult.resultIdx, status: 'WITHDRAW' } }, { multi: true },
            );
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
      blockHash = await qclient.getBlockHash(i);
      blockTime = (await qclient.getBlock(blockHash)).time;
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

// Send syncInfo subscription
function sendSyncInfo(syncBlockNum, syncBlockTime, chainBlockNum) {
  pubsub.publish('onSyncInfo', {
    onSyncInfo: {
      syncBlockNum,
      syncBlockTime,
      chainBlockNum,
    },
  });
}

// all central & decentral oracles with VOTING status and endTime less than currentBlockTime
async function updateOraclesPassedEndTime(currentBlockTime, db) {
  try {
    await db.Oracles.update(
      { endTime: { $lt: currentBlockTime }, status: 'VOTING' },
      { $set: { status: 'WAITRESULT' } },
      { multi: true },
    );
    logger.debug('Updated Oracles Passed EndBlock');
  } catch (err) {
    logger.error(`updateOraclesPassedEndBlock ${err.message}`);
  }
}

// central oracles with WAITRESULT status and resultSetEndTime less than currentBlockTime
async function updateCentralizedOraclesPassedResultSetEndTime(currentBlockTime, db) {
  try {
    await db.Oracles.update(
      { resultSetEndTime: { $lt: currentBlockTime }, token: 'QTUM', status: 'WAITRESULT' },
      { $set: { status: 'OPENRESULTSET' } }, { multi: true },
    );
    logger.debug('Updated COracles Passed ResultSetEndBlock');
  } catch (err) {
    logger.error(`updateCentralizedOraclesPassedResultSetEndBlock ${err.message}`);
  }
}

async function updateOracleBalance(oracleAddress, topicSet, db) {
  let oracle;
  try {
    oracle = await db.Oracles.findOne({ address: oracleAddress });
    if (!oracle) {
      logger.error(`find 0 oracle ${oracleAddress} in db to update`);
      return;
    }
  } catch (err) {
    logger.error(`update oracle ${oracleAddress} in db, ${err.message}`);
    return;
  }

  // related topic should be updated
  topicSet.add(oracle.topicAddress);
  let value;
  if (oracle.token === 'QTUM') {
    // centrailized
    const contract = new Contract(Config.QTUM_RPC_ADDRESS, oracleAddress, contractMetadata.CentralizedOracle.abi);
    try {
      value = await contract.call('getTotalBets', { methodArgs: [], senderAddress });
    } catch (err) {
      logger.error(`getTotalBets for oracle ${oracleAddress}, ${err.message}`);
      return;
    }
  } else {
    // decentralized
    const contract = new Contract(Config.QTUM_RPC_ADDRESS, oracleAddress, contractMetadata.DecentralizedOracle.abi);
    try {
      value = await contract.call('getTotalVotes', { methodArgs: [], senderAddress });
    } catch (err) {
      logger.error(`getTotalVotes for oracle ${oracleAddress}, ${err.message}`);
      return;
    }
  }

  const balances = _.map(value[0].slice(0, oracle.numOfResults), balanceBN => balanceBN.toJSON());

  try {
    await db.Oracles.update({ address: oracleAddress }, { $set: { amounts: balances } });
    logger.debug(`Update oracle ${oracleAddress} amounts ${balances}`);
  } catch (err) {
    logger.error(`update oracle ${oracleAddress}, ${err.message}`);
  }
}

async function updateTopicBalance(topicAddress, db) {
  let topic;
  try {
    topic = await db.Topics.findOne({ address: topicAddress });
    if (!topic) {
      logger.error(`find 0 topic ${topicAddress} in db to update`);
      return;
    }
  } catch (err) {
    logger.error(`find topic ${topicAddress} in db, ${err.message}`);
    return;
  }

  const contract = new Contract(Config.QTUM_RPC_ADDRESS, topicAddress, contractMetadata.TopicEvent.abi);
  let totalBetsValue;
  let totalVotesValue;
  try {
    const getTotalBetsPromise = contract.call('getTotalBets', { methodArgs: [], senderAddress });
    const getTotalVotesPromise = contract.call('getTotalVotes', { methodArgs: [], senderAddress });
    totalBetsValue = await getTotalBetsPromise;
    totalVotesValue = await getTotalVotesPromise;
  } catch (err) {
    logger.error(`getTotalBets for topic ${topicAddress}, ${err.message}`);
    return;
  }

  const totalBetsBalances = _.map(totalBetsValue[0].slice(0, topic.options.length), balanceBN => balanceBN.toJSON());

  const totalVotesBalances = _.map(totalVotesValue[0].slice(0, topic.options.length), balanceBN => balanceBN.toJSON());

  try {
    await db.Topics.update(
      { address: topicAddress },
      { $set: { qtumAmount: totalBetsBalances, botAmount: totalVotesBalances } },
    );
    logger.debug(`Update topic ${topicAddress} qtumAmount ${totalBetsBalances} botAmount ${totalVotesBalances}`);
  } catch (err) {
    logger.error(`update topic ${topicAddress} in db, ${err.message}`);
  }
}

module.exports = startSync;
