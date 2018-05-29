const EventEmitter = require('events');
const _ = require('lodash');
const { dialog } = require('electron');
const { ipcEvent } = require('../constants');
const i18n = require('../../src/localization/i18n');

const emitter = new EventEmitter();

emitter.on(ipcEvent.BACKUP_FILE, async (path) => {
  try {
    if (!_.isUndefined(path)) {
      await require('../api/wallet').backupWallet({ destination: path });
      const options = {
        type: 'info',
        title: 'Information',
        message: i18n.get('backupSuccess'),
        buttons: [i18n.get('ok')],
      };
      dialog.showMessageBox(options);
    }
  } catch (err) {
    const options = {
      type: 'error',
      title: i18n.get('error'),
      message: err.message,
      buttons: [i18n.get('ok')],
    };
    dialog.showMessageBox(options);
  }
});

emitter.on(ipcEvent.RESTORE_FILE, async (path) => {
  try {
    if (!_.isEmpty(path)) {
      await require('../api/wallet').importWallet({ filename: path[0] });
      const options = {
        type: 'info',
        title: 'Information',
        message: i18n.get('importSuccess'),
        buttons: [i18n.get('ok')],
      };
      dialog.showMessageBox(options);
    }
  } catch (err) {
    const options = {
      type: 'error',
      title: i18n.get('error'),
      message: err.message,
      buttons: [i18n.get('ok')],
    };
    dialog.showMessageBox(options);
  }
});

function showSaveDialog() {
  emitter.emit(ipcEvent.WALLET_BACKUP);
}

function showImportDialog() {
  emitter.emit(ipcEvent.WALLET_IMPORT);
}

module.exports = {
  Emitter: emitter,
  showSaveDialog,
  showImportDialog,
};
