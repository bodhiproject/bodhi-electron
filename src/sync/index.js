const resolvers = require('../schema/resolvers');
const _ = require('lodash');
const connectDB = require('../db')

const Qweb3 = require('../qweb3.js/src/qweb3');
const qclient = new Qweb3('http://bodhi:bodhi@localhost:13889');


const Topic = require('./models/topic');
const CentralizedOracle = require('./models/centralizedOracle');
const DecentralizedOracle = require('./models/decentralizedOracle');
const Vote = require('./models/vote');
const OracleResultSet = require('./models/oracleResultSet');
const FinalResultSet = require('./models/finalResultSet');

const Contracts = require('./contracts');
const contractEventFactory = qclient.Contract(Contracts.EventFactory.address, Contracts.EventFactory.abi);
const contractOracleFactory = qclient.Contract(Contracts.OracleFactory.address, Contracts.OracleFactory.abi);
const constractTopicEvent = qclient.Contract(null, Contracts.TopicEvent.abi);
const constractCentralizedOracle = qclient.Contract(null, Contracts.CentralizedOracle.abi);
const constractDecentralizedOracle = qclient.Contract(null, Contracts.DecentralizedOracle.abi);

const batch_size=100;

let currentSyncBlockHeight = 44589;

function sequentialLoop(iterations, process, exit){
  var index = 0, done=false;

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

function sync(db){
  qclient.getBlockCount().then(
    (value)=>{
      currentBlockChainHeight = value - 1;
      var start_block = 44589;

      var initialSync = sequentialLoop(Math.ceil((currentBlockChainHeight-start_block)/batch_size), function(loop){
        var end_block = Math.min(start_block + batch_size, currentBlockChainHeight);
        var syncTopic = false, syncCOracle = false, syncDOracle = false, syncVote = false,
            syncOracleResult = false, syncFinalResult = false;

        // sync TopicCreated
        contractEventFactory.searchLogs(start_block, end_block, Contracts.EventFactory.address, [])
          .then(
            (result) => {
              console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from TopicCreated`);
              // write to db
              _.forEach(result, (event, index) => {
                let blockNum = event.blockNumber
                _.forEachRight(event.log, (rawLog) => {
                  if(rawLog['_eventName'] === 'TopicCreated'){
                    var topic = new Topic(blockNum, rawLog);
                    db.Topics.insert(topic.translate());
                  }
                })
              });

              syncTopic = true;

              if (syncTopic && syncCOracle && syncDOracle && syncVote && syncOracleResult && syncFinalResult){
                start_block = end_block+1;
                loop.next();
              }
            },
          (err) => {
            console.log(err.message);
            loop.break(true);
          });

        // sync CentrailizedOracleCreatedEvent
        contractOracleFactory.searchLogs(start_block, end_block, Contracts.EventFactory.address, [])
        .then(
          (result) => {
            console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from CentrailizedOracleCreatedEvent`);
            // write to db
            _.forEach(result, (event, index) => {
              let blockNum = event.blockNumber
              _.forEachRight(event.log, (rawLog) => {
                if(rawLog['_eventName'] === 'CentralizedOracleCreated'){
                  var central_oracle = new CentralizedOracle(blockNum, rawLog);
                  db.Oracles.insert(central_oracle.translate());
                }
              })
            });

            syncCOracle = true;

            if (syncTopic && syncCOracle && syncDOracle && syncVote && syncOracleResult && syncFinalResult){
              start_block = end_block+1;
              loop.next();
            }
          },
        (err) => {
          console.log(err.message);
          loop.break(true);
        });

        // sync DecentrailizedOracleCreatedEvent
        contractOracleFactory.searchLogs(start_block, end_block, [], Contracts.OracleFactory.DecentralizedOracleCreated)
        .then(
          (result) => {
            console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from CentrailizedOracleCreatedEvent`);
            // write to db
            _.forEach(result, (event, index) => {
              let blockNum = event.blockNumber
              _.forEachRight(event.log, (rawLog) => {
                if(rawLog['_eventName'] === 'DecentralizedOracleCreated'){
                  var decentral_oracle = new DecentralizedOracle(blockNum, rawLog);
                  db.Oracles.insert(decentral_oracle.translate());
                }
              })
            });

            syncDOracle = true;

            if (syncTopic && syncCOracle && syncDOracle && syncVote && syncOracleResult && syncFinalResult){
              start_block = end_block+1;
              loop.next();
            }
          },
        (err) => {
          console.log(err.message);
          loop.break(true);
        });

        // sync OracleResultVoted
        constractCentralizedOracle.searchLogs(start_block, end_block, [], Contracts.CentralizedOracle.OracleResultVoted)
        .then(
          (result) => {
            console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from OracleResultVoted`);
            // write to db
            _.forEach(result, (event, index) => {
              let blockNum = event.blockNumber
              _.forEachRight(event.log, (rawLog) => {
                if(rawLog['_eventName'] === 'OracleResultVoted'){
                  var vote = new Vote(blockNum, rawLog);
                  db.Votes.insert(vote.translate());
                }
              })
            });

            syncVote = true;

            if (syncTopic && syncCOracle && syncDOracle && syncVote && syncOracleResult && syncFinalResult){
              start_block = end_block+1;
              loop.next();
            }
          },
        (err) => {
          console.log(err.message);
          loop.break(true);
        });

        // sync OracleResultSet
        constractCentralizedOracle.searchLogs(start_block, end_block, [], Contracts.CentralizedOracle.OracleResultSet)
        .then(
          (result) => {
            console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from OracleResultSet`);
            // write to db
            _.forEach(result, (event, index) => {
              let blockNum = event.blockNumber
              _.forEachRight(event.log, (rawLog) => {
                if(rawLog['_eventName'] === 'OracleResultSet'){
                  var oracle_result = new OracleResultSet(blockNum, rawLog);
                  // console.log(oracle_result);
                  db.Oracles.findAndModify({address: oracle_result.oracleAddress}, [['_id','asc']], {$set: {resultIdx: oracle_result.resultIndex}}, {});
                }
              })
            });

            syncOracleResult = true;

            if (syncTopic && syncCOracle && syncDOracle && syncVote && syncOracleResult && syncFinalResult){
              start_block = end_block+1;
              loop.next();
            }
          },
        (err) => {
          console.log(err.message);
          loop.break(true);
        });

        // sync FinalResultSet
        constractTopicEvent.searchLogs(start_block, end_block, [], Contracts.TopicEvent.FinalResultSet)
        .then(
          (result) => {
            console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from FinalResultSet`);
            // write to db
            _.forEach(result, (event, index) => {
              let blockNum = event.blockNumber
              _.forEachRight(event.log, (rawLog) => {
                if(rawLog['_eventName'] === 'FinalResultSet'){
                  // console.log(topic_result);
                  var topic_result = new FinalResultSet(blockNum, rawLog).translate();
                  db.Topics.findAndModify({address: topic_result.topicAddress}, [['_id','asc']], {$set: {resultIdx: topic_result.resultIdx}}, {}, function(err, object) {
                    if (err){
                        console.warn(err.message);  // returns error if no matching object found
                    }else{
                        console.dir(object);
                    }
                  });
                }
              })
            });

            syncFinalResult = true;

            if (syncTopic && syncCOracle && syncDOracle && syncVote && syncOracleResult && syncFinalResult){
              start_block = end_block+1;
              loop.next();
            }
          },
        (err) => {
          console.log(err.message);
          loop.break(true);
        });
      }, function(){
        setTimeout(sync, 10000);
        console.log('done');
      });
    });

}

const startSync = async () => {
  const mongoDB = await connectDB();
  sync(mongoDB)
};

startSync();
