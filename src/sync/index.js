const _ = require('lodash');
const Qweb3 = require('qweb3').default;
const Contract = require('qweb3').Contract;

const config = require('../config');
const connectDB = require('../db/nedb')

const qclient = new Qweb3(config.QTUM_RPC_ADDRESS);

const Topic = require('./models/topic');
const CentralizedOracle = require('./models/centralizedOracle');
const DecentralizedOracle = require('./models/decentralizedOracle');
const Vote = require('./models/vote');
const OracleResultSet = require('./models/oracleResultSet');
const FinalResultSet = require('./models/finalResultSet');

const Contracts = require('./contracts');

const batchSize = 200;

const contractDeployedBlockNum = 65749;

const senderAddress = 'qKjn4fStBaAtwGiwueJf9qFxgpbAvf1xAy'; // hardcode sender address as it doesnt matter

const RPC_BATCH_SIZE = 20;

var currentBlockChainHeight = 0

function sequentialLoop(iterations, process, exit){
  var index = 0, done=false, shouldExit=false;

  var loop = {
      next:function(){
        if(done){
          if(shouldExit && exit){
            return exit();
          }
        }

        if(index < iterations){
          index++;
          process(loop);
        }else{
          done = true;

          if(exit){
            exit();
          }
        }
      },

      iteration:function(){
        return index - 1; // Return the loop number we're on
      },

      break:function(end){
        done = true;
        shouldExit = end;
      },
  };
  loop.next();
  return loop;
}

async function sync(db){
  const removeHexPrefix = true;
  var topicsNeedBalanceUpdate = new Set(), oraclesNeedBalanceUpdate = new Set();
  let oraclesNeedInfoUpdate = [];

  let currentBlockChainHeight = await qclient.getBlockCount();
  currentBlockChainHeight = currentBlockChainHeight - 1;
  let options = {
    "limit": 1,
    "sort": [["blockNum", 'desc']]
  }

  var startBlock = contractDeployedBlockNum;
  let block = await db.Blocks.cfind({}).sort({blockNum:-1}).limit(1).exec();
  if(block.length > 0){
    startBlock = Math.max(block.blockNum + 1, startBlock);
  }

  var initialSync = sequentialLoop(Math.ceil((currentBlockChainHeight-startBlock)/batchSize), function(loop){
    var endBlock = Math.min(startBlock + batchSize - 1, currentBlockChainHeight);
    var syncTopic = false, syncCOracle = false, syncDOracle = false, syncVote = false, syncOracleResult = false, syncFinalResult = false;

    var syncTopicCreatedPromise = new Promise(async (resolve) => { 
      syncTopicCreated(resolve, db, startBlock, endBlock, removeHexPrefix); 
    });
    var syncCentralizedOracleCreatedPromise = new Promise(async (resolve) => { 
      syncCentralizedOracleCreated(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedInfoUpdate);
    });
    var syncDecentralizedOracleCreatedPromise = new Promise(async (resolve) => { 
      syncDecentralizedOracleCreated(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedInfoUpdate);
    });
    var syncOracleResultVotedPromise = new Promise(async (resolve) => { 
      syncOracleResultVoted(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate); 
    });
    var syncOracleResultSetPromise = new Promise(async (resolve) => { 
      syncOracleResultSet(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate);
    });
    var syncFinalResultSetPromise = new Promise(async (resolve) => { 
      syncFinalResultSet(resolve, db, startBlock, endBlock, removeHexPrefix, topicsNeedBalanceUpdate);
    });

    var syncPromises = [];
    var updatePromises = [];
    syncPromises.push(syncTopicCreatedPromise);
    syncPromises.push(syncCentralizedOracleCreatedPromise);
    syncPromises.push(syncDecentralizedOracleCreatedPromise);
    syncPromises.push(syncOracleResultVotedPromise);
    updatePromises.push(syncOracleResultSetPromise);
    updatePromises.push(syncFinalResultSetPromise);

    Promise.all(syncPromises).then(() => {
      console.log('Synced Topics & Oracles');
      // sync first and then update in case update object in current batch
      Promise.all(updatePromises).then(() =>{
        console.log('Updated OracleResult & FinalResult\n');

        const updateBlockPromises = [];
        for (var i=startBlock; i<=endBlock; i++) {
          let updateBlockPromise = new Promise(async (resolve) => {
            let resp = await db.Blocks.insert({'blockNum': i});
            resolve();
          });
          updateBlockPromises.push(updateBlockPromise);
        }

        Promise.all(updateBlockPromises).then(() => {
          startBlock = endBlock+1;
          loop.next();
        });
      });
    });
  },
  async function() {
    // Insert Oracle names and options
    await updateOracleInfo(db, oraclesNeedInfoUpdate);

    var oracle_address_batches = _.chunk(Array.from(oraclesNeedBalanceUpdate), RPC_BATCH_SIZE);
    // execute rpc batch by batch
    sequentialLoop(oracle_address_batches.length, async function(loop) {
      var iteration = loop.iteration();
      console.log(`oracle batch: ${iteration}`);
      await Promise.all(oracle_address_batches[iteration].map(async (oracle_address) => {
        await updateOracleBalance(oracle_address, topicsNeedBalanceUpdate, db);
      }));

      // Oracle balance update completed
      if (iteration === oracle_address_batches.length - 1){
        // two rpc call per topic balance so batch_size = RPC_BATCH_SIZE/2
        var topic_address_batches = _.chunk(Array.from(topicsNeedBalanceUpdate), Math.floor(RPC_BATCH_SIZE/2));
        sequentialLoop(topic_address_batches.length, async function(topicLoop) {
          var iteration = topicLoop.iteration();
          console.log(`topic batch: ${iteration}`);
          await Promise.all(topic_address_batches[iteration].map(async (topic_address) => {
            await updateTopicBalance(topic_address, db);
          }));
          console.log('next topic batch');
          topicLoop.next();
        }, function() {
          console.log('Updated topics balance');
          loop.next();
        });
      } else {
        console.log('next oracle batch');
        loop.next();
      }
    }, async function() {
      await updateOraclesPassedEndBlock(currentBlockChainHeight, db);
      // must ensure updateCentralizedOraclesPassedResultSetEndBlock after updateOraclesPassedEndBlock
      await updateCentralizedOraclesPassedResultSetEndBlock(currentBlockChainHeight, db);

      // nedb doesnt require close db, leave the comment as a reminder
      // await db.Connection.close();
      console.log('sleep');
      setTimeout(startSync, 5000);
    });
  });
}

async function syncTopicCreated(resolve, db, startBlock, endBlock, removeHexPrefix) {
  let result;
  try {
    result = await qclient.searchLogs(startBlock, endBlock, Contracts.EventFactory.address, 
      [Contracts.EventFactory.TopicCreated], Contracts, removeHexPrefix);
    console.log('searchlog TopicCreated')
  } catch(err) {
    console.error(`ERROR: ${err.message}`);
    resolve();
    return;
  }

  console.log(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from TopicCreated`);
  var createTopicPromises = [];

  _.forEach(result, (event, index) => {
    let blockNum = event.blockNumber;
    let txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if(rawLog['_eventName'] === 'TopicCreated'){
        var insertTopicDB = new Promise(async (resolve) =>{
          try {
            var topic = new Topic(blockNum, txid, rawLog).translate();
            await db.Topics.insert(topic);
            resolve();
          } catch(err) {
            console.error(`ERROR: ${err.message}`);
            resolve();
            return;
          }
        });

        createTopicPromises.push(insertTopicDB);
      }
    });
  });

  Promise.all(createTopicPromises).then(()=>{
    resolve();
  });
}

async function syncCentralizedOracleCreated(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedInfoUpdate) {
  let result;
  try {
    result = await qclient.searchLogs(startBlock, endBlock, Contracts.EventFactory.address, 
      [Contracts.OracleFactory.CentralizedOracleCreated], Contracts, removeHexPrefix);
    console.log('searchlog CentralizedOracleCreated')
  } catch(err) {
    console.error(`ERROR: ${err.message}`);
    resolve();
    return;
  }

  console.log(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from CentralizedOracleCreated`);
  var createCentralizedOraclePromises = [];

  _.forEach(result, (event, index) => {
    let blockNum = event.blockNumber;
    let txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if(rawLog['_eventName'] === 'CentralizedOracleCreated'){
        var insertOracleDB = new Promise(async (resolve) =>{
          try {
            var centralOracle = new CentralizedOracle(blockNum, txid, rawLog).translate();
            await db.Oracles.insert(centralOracle);
            oraclesNeedInfoUpdate.push(centralOracle.address);
            resolve();
          } catch(err) {
            console.error(`ERROR: ${err.message}`);
            resolve();
            return;
          }
        });

        createCentralizedOraclePromises.push(insertOracleDB);
      }
    });
  });

  Promise.all(createCentralizedOraclePromises).then(()=>{
    resolve();
  });
}

async function syncDecentralizedOracleCreated(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedInfoUpdate) {
  let result;
  try {
    result = await qclient.searchLogs(startBlock, endBlock, [], Contracts.OracleFactory.DecentralizedOracleCreated, 
      Contracts, removeHexPrefix)
    console.log('searchlog DecentralizedOracleCreated')
  } catch(err) {
    console.error(`ERROR: ${err.message}`);
    resolve();
    return;
  }

  console.log(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from DecentralizedOracleCreated`);
  var createDecentralizedOraclePromises = [];

  _.forEach(result, (event, index) => {
    let blockNum = event.blockNumber;
    let txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if(rawLog['_eventName'] === 'DecentralizedOracleCreated'){
        var insertOracleDB = new Promise(async (resolve) =>{
          try {
            var decentralOracle = new DecentralizedOracle(blockNum, txid, rawLog).translate();
            await db.Oracles.insert(decentralOracle);
            oraclesNeedInfoUpdate.push(decentralOracle.address);
            resolve();
          } catch(err) {
            console.error(`ERROR: ${err.message}`);
            resolve();
            return;
          }
        });
        createDecentralizedOraclePromises.push(insertOracleDB);
      }
    });
  });

  Promise.all(createDecentralizedOraclePromises).then(()=>{
    resolve();
  });
}

async function syncOracleResultVoted(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate) {
  let result;
  try {
    result = await qclient.searchLogs(startBlock, endBlock, [], Contracts.CentralizedOracle.OracleResultVoted, 
      Contracts, removeHexPrefix)
    console.log('searchlog OracleResultVoted')
  } catch(err) {
    console.error(`ERROR: ${err.message}`);
    resolve();
    return;
  }

  console.log(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from OracleResultVoted`);
  var createOracleResultVotedPromises = [];

  _.forEach(result, (event, index) => {
    let blockNum = event.blockNumber;
    let txid = event.transactionHash;
    _.forEachRight(event.log, (rawLog) => {
      if(rawLog['_eventName'] === 'OracleResultVoted'){
        var insertVoteDB = new Promise(async (resolve) =>{
          try {
            var vote = new Vote(blockNum, txid, rawLog).translate();
            oraclesNeedBalanceUpdate.add(vote.oracleAddress);

            await db.Votes.insert(vote);
            resolve();
          } catch(err){
            console.error(`ERROR: ${err.message}`);
            resolve();
            return;
          }
        });

        createOracleResultVotedPromises.push(insertVoteDB);
      }
    });
  });

  Promise.all(createOracleResultVotedPromises).then(()=>{
    resolve();
  });
}

async function syncOracleResultSet(resolve, db, startBlock, endBlock, removeHexPrefix, oraclesNeedBalanceUpdate) {
  let result;
  try {
    result = await qclient.searchLogs(startBlock, endBlock, [], Contracts.CentralizedOracle.OracleResultSet, Contracts, 
      removeHexPrefix)
    console.log('searchlog OracleResultSet')
  } catch(err) {
    console.error(`ERROR: ${err.message}`);
    resolve();
    return;
  }

  console.log(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from OracleResultSet`);
  var updateOracleResultSetPromises = [];

  _.forEach(result, (event, index) => {
    _.forEachRight(event.log, (rawLog) => {
      if(rawLog['_eventName'] === 'OracleResultSet'){
        var updateOracleResult = new Promise(async (resolve) =>{
          try {
            var oracleResult = new OracleResultSet(rawLog).translate();
            // safeguard to update balance, can be removed in the future
            oraclesNeedBalanceUpdate.add(oracleResult.oracleAddress);

            await db.Oracles.update({address: oracleResult.oracleAddress}, 
              {$set: {resultIdx: oracleResult.resultIdx, status:'PENDING'}}, {});
            resolve();
          } catch(err) {
            console.error(`ERROR: ${err.message}`);
            resolve();
            return;
          }
        });

        updateOracleResultSetPromises.push(updateOracleResult);
      }
    });
  })

  Promise.all(updateOracleResultSetPromises).then(()=>{
    resolve();
  });
}

async function syncFinalResultSet(resolve, db, startBlock, endBlock, removeHexPrefix, topicsNeedBalanceUpdate) {
  let result;
  try {
    result = await qclient.searchLogs(startBlock, endBlock, [], Contracts.TopicEvent.FinalResultSet, Contracts, 
      removeHexPrefix)
    console.log('searchlog FinalResultSet')
  } catch(err) {
    console.error(`ERROR: ${err.message}`);
    resolve();
    return;
  }

  console.log(`${startBlock} - ${endBlock}: Retrieved ${result.length} entries from FinalResultSet`);
  var updateFinalResultSetPromises = [];

  _.forEach(result, (event, index) => {
    _.forEachRight(event.log, (rawLog) => {
      if(rawLog['_eventName'] === 'FinalResultSet'){
        var updateFinalResultSet = new Promise(async (resolve) =>{
          try {
            var topicResult = new FinalResultSet(rawLog).translate();
            // safeguard to update balance, can be removed in the future
            topicsNeedBalanceUpdate.add(topicResult.topicAddress);

            await db.Topics.update({address: topicResult.topicAddress}, 
              {$set: {resultIdx: topicResult.resultIdx, status:'WITHDRAW'}}, {});
            resolve();
          } catch(err) {
            console.error(`ERROR: ${err.message}`);
            resolve();
            return;
          }
        });

        updateFinalResultSetPromises.push(updateFinalResultSet);
      }
    });
  });

  Promise.all(updateFinalResultSetPromises).then(()=>{
    resolve();
  });
}

async function updateOraclesPassedEndBlock(currentBlockChainHeight, db, resolve){
  // all central & decentral oracles with VOTING status and endBlock less than currentBlockChainHeight
  try {
    await db.Oracles.update({endBlock: {$lt:currentBlockChainHeight}, status: 'VOTING'}, {$set: {status:'WAITRESULT'}}, {multi: true});
    console.log('Updated Oracles Passed EndBlock');
  }catch(err){
    console.error(`ERROR: updateOraclesPassedEndBlock ${err.message}`);
  }
}

async function updateCentralizedOraclesPassedResultSetEndBlock(currentBlockChainHeight, db){
  // central oracels with WAITRESULT status and resultSetEndBlock less than  currentBlockChainHeight
  try {
    await db.Oracles.update({resultSetEndBlock: {$lt: currentBlockChainHeight}, token: 'QTUM', status: 'WAITRESULT'},
      {$set: {status:'OPENRESULTSET'}}, {multi: true});
    console.log('Updated COracles Passed ResultSetEndBlock');
  }catch(err){
    console.error(`ERROR: updateCentralizedOraclesPassedResultSetEndBlock ${err.message}`);
  }
}

async function updateOracleInfo(db, oraclesNeedInfoUpdate) {
  _.forEach(oraclesNeedInfoUpdate, async (oracleAddress, index) => {
    let oracle;
    try {
      oracle = await db.Oracles.findOne({ 
        address: oracleAddress 
      });

      if (!oracle) {
        console.error(`ERROR: could not find Oracle ${oracleAddress} in db`);
        return false;
      }
    } catch(err) {
      console.error(`ERROR: find Oracle ${oracleAddress} in db, ${err.message}`);
      return false;
    }

    let topic;
    try {
      topic = await db.Topics.findOne({
        address: oracle.topicAddress
      });

      if (!topic) {
        console.error(`ERROR: could not find Topic ${oracle.topicAddress} in db`);
        return false;
      }
    } catch(err){
      console.error(`ERROR: find Topic ${oracle.topicAddress} in db, ${err.message}`);
      return false;
    }

    try {
      await db.Oracles.update(
        { address: oracleAddress }, 
        { $set: { 
          name: topic.name, 
          options: topic.options }
        }
      );
      console.log(`Update Oracle ${oracleAddress} name and options`);
    } catch(err){
      console.error(`ERROR: update Oracle ${oracleAddress} in db, ${err.message}`);
    }
  });
}

async function updateOracleBalance(oracleAddress, topicSet, db){
  var oracle;
  try {
    oracle = await db.Oracles.findOne({address: oracleAddress});
    if (!oracle){
      console.error(`ERROR: find 0 oracle ${oracleAddress} in db to update`);
      return;
    }
  } catch(err){
    console.error(`ERROR: update oracle ${oracleAddress} in db, ${err.message}`);
    return;
  }

  // related topic should be updated
  topicSet.add(oracle.topicAddress);
  var value;
  if(oracle.token === 'QTUM'){
    // centrailized
    const contract = new Contract(config.QTUM_RPC_ADDRESS, oracleAddress, Contracts.CentralizedOracle.abi);
    try {
      value = await contract.call('getTotalBets',{ methodArgs: [], senderAddress: senderAddress});
    } catch(err){
      console.error(`ERROR: getTotalBets for oracle ${oracleAddress}, ${err.message}`);
      return;
    }
  }else{
    // decentralized
    const contract = new Contract(config.QTUM_RPC_ADDRESS, oracleAddress, Contracts.DecentralizedOracle.abi);
    try {
      value = await contract.call('getTotalVotes', { methodArgs: [], senderAddress: senderAddress});
    } catch(err){
      console.error(`ERROR: getTotalVotes for oracle ${oracleAddress}, ${err.message}`);
      return;
    }
  }

  let balances = _.map(value[0].slice(0, oracle.numOfResults), (balance_BN) => {
    return balance_BN.toJSON();
  });

  try {
    await db.Oracles.update({address: oracleAddress}, { $set: { amounts: balances }});
    console.log(`Update oracle ${oracleAddress} amounts ${balances}`);
  } catch(err){
    console.error(`ERROR: update oracle ${oracleAddress}, ${err.message}`);
  }
}

async function updateTopicBalance(topicAddress, db){
  var topic;
  try{
    topic = await db.Topics.findOne({address: topicAddress});
    if (!topic){
      console.error(`ERROR: find 0 topic ${topicAddress} in db to update`);
      return;
    }
  } catch(err){
    console.error(`ERROR: find topic ${topicAddress} in db, ${err.message}`);
    return;
  }

  const contract = new Contract(config.QTUM_RPC_ADDRESS, topicAddress, Contracts.TopicEvent.abi);
  var totalBetsValue, totalVotesValue;
  try{
    // TODO(frankobe): mk this two async
    totalBetsValue = await contract.call('getTotalBets', { methodArgs: [], senderAddress: senderAddress});
    totalVotesValue = await contract.call('getTotalVotes', { methodArgs: [], senderAddress: senderAddress});
  }catch(err){
    console.error(`ERROR: getTotalBets for topic ${topicAddress}, ${err.message}`);
    return;
  }

  let totalBetsBalances = _.map(totalBetsValue[0].slice(0, topic.options.length), (balance_BN) =>{
    return balance_BN.toJSON();
  });

  let totalVotesBalances = _.map(totalVotesValue[0].slice(0, topic.options.length), (balance_BN) =>{
    return balance_BN.toJSON();
  });

  try {
    await db.Topics.update({address: topicAddress}, { $set: { qtumAmount: totalBetsBalances, botAmount: totalVotesBalances }});
    console.log(`Update topic ${topicAddress} qtumAmount ${totalBetsBalances} botAmount ${totalVotesBalances}`);
  }catch(err){
    console.error(`ERROR: update topic ${topicAddress} in db, ${err.message}`);
  }
}

const startSync = async () => {
  const db = await connectDB();
  sync(db)
};

module.exports = startSync;
