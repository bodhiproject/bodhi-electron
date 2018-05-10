const EventEmitter = require('events');
const _ = require('lodash');
const { ipcEvent } = require('../constants');

const emitter = new EventEmitter();


emitter.on('saved-file', async (path) => {
  await require('../api/wallet').backupWallet({destination: path});
})

emitter.on('selected-file', async (path) => {
  await require('../api/wallet').importWallet({destination: path});
})


function showSaveDialog(){
  emitter.emit(ipcEvent.WALLET_BACKUP);
}

function showImportDialog(){
  emitter.emit(ipcEvent.WALLET_IMPORT);
}


module.exports = {
  emitter,
  showSaveDialog,
  showImportDialog,
};
