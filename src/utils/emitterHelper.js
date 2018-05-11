const EventEmitter = require('events');
const _ = require('lodash');
const { dialog } = require('electron');
const chalk = require('chalk');
const { ipcEvent } = require('../constants');
const i18n = require('../../src/localization/i18n');

const emitter = new EventEmitter();


emitter.on('saved-file', async (path) => {
  try{
    if(!_.isUndefined(path)){
      await require('../api/wallet').backupWallet({destination: path});
      const options = {
        type: 'info',
        title: 'Information',
        message: i18n.get('backupSuccess'),
        buttons: [i18n.get('ok')]
      }
      dialog.showMessageBox(options);
    }
  }
  catch (err) {
    const options = {
      type: 'info',
      title: 'Information',
      message: i18n.get('somethingWrongHappened'),
      buttons: [i18n.get('ok')]
    }
    dialog.showMessageBox(options);
  }
})

emitter.on('selected-file', async (path) => {
  try{
    await require('../api/wallet').importWallet({filename: path[0]})
    const options = {
      type: 'info',
      title: 'Information',
      message: i18n.get('importSuccess'),
      buttons: [i18n.get('ok')]
    }
    if(path !== ''){
      dialog.showMessageBox(options);
    }
  }
  catch (err) {
    const options = {
      type: 'info',
      title: 'Information',
      message: i18n.get('somethingWrongHappened'),
      buttons: [i18n.get('ok')]
    }
    dialog.showMessageBox(options);
  }
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
