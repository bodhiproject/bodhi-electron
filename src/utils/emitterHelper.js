const EventEmitter = require('events');
const _ = require('lodash');
const { dialog } = require('electron');
const chalk = require('chalk');
const { ipcEvent } = require('../constants');

const emitter = new EventEmitter();


emitter.on('saved-file', async (path) => {
  try{
    if(!_.isUndefined(path)){
      await require('../api/wallet').backupWallet({destination: path});
      const options = {
        type: 'info',
        title: 'Information',
        message: "Backup success.",
        buttons: ['OK']
      }
      dialog.showMessageBox(options);
    }
  }
  catch (err) {
    const options = {
      type: 'info',
      title: 'Information',
      message: "Something wrong happened.",
      buttons: ['OK']
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
      message: "Import success.",
      buttons: ['OK']
    }
    if(path !== ''){
      dialog.showMessageBox(options);
    }
  }
  catch (err) {
    const options = {
      type: 'info',
      title: 'Information',
      message: "Something wrong happened.",
      buttons: ['OK']
    }
    dialog.showMessageBox(options);
  }
})


function showSaveDialog(){
  console.log(chalk.green('showSaveDialog'));
  emitter.emit(ipcEvent.WALLET_BACKUP);
}

function showImportDialog(){
  console.log(chalk.red('showImportDialog'));

  emitter.emit(ipcEvent.WALLET_IMPORT);
}


module.exports = {
  emitter,
  showSaveDialog,
  showImportDialog,
};
