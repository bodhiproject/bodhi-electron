// const resolvers = require('./resolvers');
const Contracts = require('./contracts');

const Qweb3 = require('../qweb3/src/qweb3');
const qclient = new Qweb3('http://bodhi:bodhi@localhost:13889');
const contractEventFactory = qclient.Contract(Contracts.EventFactory.address, Contracts.EventFactory.abi);
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
// // while (true){
//   var currentBlockChainHeight = qclient.getBlockCount().then(
//     (value)=>{
//       currentBlockChainHeight = value-1

//       console.log(`${currentBlockChainHeight}`);
//       if (currentSyncBlockHeight === 0){
//         lastBlock = null
//         if (lastBlock){
//           currentSyncBlockHeight = lastBlock;
//         }
//       }

//       start_block = currentSyncBlockHeight + 1;
//       // end_block = Math.min(currentBlockChainHeight, start_block+batch_size);

//       let serialPromise = Promise.resolve();
//       for( var end_block = start_block; end_block < currentBlockChainHeight; end_block += Math.min(batch_size, currentSyncBlockHeight-start_block) ){
//         console.log('outside promise call');
//         console.log('start_block',start_block);

//         serialPromise = serialPromise.then(()=>{
//           console.log('inside promise call');
//           console.log('start_block',start_block);
//           console.log('end_block',end_block);

//           return contractEventFactory.searchLogs(start_block, end_block, Contracts.EventFactory.address, [])
//           .then(
//             (result) => {
//               console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from EventFactory`);
//               // write to db
//               console.log(result)
//               start_block = end_block+1;
//               return Promise.resolve();
//             },
//             (err) => {
//               console.log(err.message);
//               return Promise.reject();
//             }
//           )
//         })
//       };
//         // sleep(10000)
//       }
//   );
// // };

function sync(){
  qclient.getBlockCount().then(
    (value)=>{
      currentBlockChainHeight = value - 1;
      var start_block = 44589;

      var initialSync = sequentialLoop(Math.ceil((currentBlockChainHeight-start_block)/batch_size), function(loop){
        var end_block = Math.min(start_block + batch_size, currentBlockChainHeight);
        contractEventFactory.searchLogs(start_block, end_block, Contracts.EventFactory.address, [])
          .then(
            (result) => {
              console.log(`${start_block} - ${end_block}: Retrieved ${result.length} entries from EventFactory`);
              // write to db
              console.log(result)
              start_block = end_block+1;
              loop.next();
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

sync();