const _ = require('lodash');
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const prompt = require('electron-prompt');

const { testnetOnly } = require('./package.json');
const { initDB } = require('./server/src/db/nedb');
const { startServer, emitter } = require('./server/src/server');
const { getEmitter } = require('./server/src/utils/emitterHelper');
const { Config, setQtumEnv, getQtumExplorerUrl } = require('./server/src/config/config');
const { getLogger } = require('./server/src/utils/logger');
const { blockchainEnv, ipcEvent } = require('./server/src/constants');
const Tracking = require('./server/src/analytics/tracking');
const Utils = require('./server/src/utils/utils');
const Wallet = require('./server/src/api/wallet');
const { version } = require('./package.json');

/*
* Order of Operations
* 1. Show select env dialog
* 2. Set qtum env
* 3. Init DB
* 4. Start qtumd & start loading window
* 5. Check wallet encryption
* 6. Show wallet unlock dialog if necessary
* 7. Start sync/API
* 8. Load UI
*/

const EXPLORER_URL_PLACEHOLDER = 'https://qtumhost';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let uiWin;
let i18n;

// function startServer() {
//   server.startQtumProcess(false);
// }

function createWindow() {
  // Create the browser window.
  uiWin = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      nativeWindowOpen: true,
    },
  });

  uiWin.on('closed', () => {
    getLogger().debug('uiWin closed');
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    uiWin = null
    app.quit();
  });

  uiWin.webContents.on('new-window', (event, url) => {
    event.preventDefault();

    let formattedUrl = url;
    if (url.includes(EXPLORER_URL_PLACEHOLDER)) {
      formattedUrl = url.replace(EXPLORER_URL_PLACEHOLDER, getQtumExplorerUrl());
    }
    shell.openExternal(formattedUrl);
  });

  // Load intermediary loading page
  uiWin.loadURL(`file://${__dirname}/ui/html/loading/index.html`);
}

function setupMenu() {
  const template = [
    {
      label: "Application",
      submenu: [
        { label: "Launch Qtum Wallet", click: () => showLaunchQtumWalletDialog() },
        { label: "About", click: () => showAboutDialog() },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
      ]
    },
    {
      label: 'View',
      submenu: [
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function initUI() {
  // If --noelec flag is supplied, don't open any Electron windows
  if (_.includes(process.argv, '--noelec')) {
    return;
  }

  // Init BrowserWindow
  createWindow();
  setupMenu();
}

// Show environment selection dialog
function showSelectEnvDialog() {
  app.focus();
  dialog.showMessageBox({
    type: 'question',
    buttons: [i18n.get('mainnet'), i18n.get('testnet'), i18n.get('quit')],
    title: i18n.get('selectQtumEnvironment'),
    message: i18n.get('selectQtumEnvironment'),
    defaultId: 2,
    cancelId: 2,
  }, async (response) => {
    switch (response) {
      case 0: {
        if (testnetOnly) { // Testnet only
          dialog.showMessageBox({
            type: 'info',
            buttons: [],
            title: i18n.get('earlyAccessDialogTitle'),
            message: i18n.get('earlyAccessDialogMessage'),
          });
          showSelectEnvDialog();
        } else { // Mainnet/Testnet allowed
          startServer(blockchainEnv.MAINNET);
          initUI();
        }

        Tracking.mainnetStart();
        break;
      }
      case 1: {
        startServer(blockchainEnv.TESTNET);
        initUI();

        Tracking.testnetStart();
        break;
      }
      case 2: {
        app.quit();
        return;
      }
      default: {
        throw new Error(`Invalid dialog button selection ${response}`);
      }
    }
  });
}

function showWalletErrorDialog(message) {
  const buttons = [i18n.get('quit')];

  if (message.includes('The wallet passphrase entered was incorrect.')) {
    buttons.push(i18n.get('retry'));
  }

  dialog.showMessageBox({
    type: 'error',
    title: i18n.get('error'),
    message,
    buttons,
    defaultId: 0,
    cancelId: 0,
  }, (response) => {
    if (response === 0) {
      app.quit();
    } else {
      showWalletUnlockPrompt();
    }
  });
}

function showWalletUnlockPrompt() {
  prompt({
    title: i18n.get('unlockWallet'),
    label: i18n.get('enterYourWalletPassphrase'),
    value: '',
    type: 'input',
    inputAttrs: {
      type: 'password'
    },
  }).then(async (res) => {
    // null if window was closed, or user clicked Cancel
    if (res === null) {
      app.quit();
    } else {
      if (_.isEmpty(res)) {
        throw new Error('The wallet passphrase entered was incorrect.');
      }

      // Unlock wallet
      await Wallet.walletPassphrase({ passphrase: res, timeout: Config.UNLOCK_SECONDS });
      const info = await Wallet.getWalletInfo();
      if (info.unlocked_until > 0) {
        getLogger().info('Wallet unlocked');
        server.startServices();
      } else {
        getLogger().error('Wallet unlock failed');
        throw new Error(i18n.get('walletUnlockFailed'));
      }
    }
  }).catch((err) => {
    getLogger().error(err.message);
    showWalletErrorDialog(err.message);
  });
}

function showLaunchQtumWalletDialog() {
  app.focus();
  dialog.showMessageBox({
    type: 'question',
    buttons: [i18n.get('cancel'), i18n.get('launch')],
    title: i18n.get('qtumWalletDialogTitle'),
    message: i18n.get('qtumWalletDialogMessage'),
    defaultId: 0,
    cancelId: 0,
  }, (response) => {
    if (response === 1) {
      if (server.getQtumProcess()) {
        server.terminateDaemon();
      } else {
        // Show dialog to wait for initializing to finish
        dialog.showMessageBox({
          type: 'error',
          buttons: [i18n.get('ok')],
          title: i18n.get('error'),
          message: i18n.get('functionDisabledUntilInitialized'),
        });
      }
    }
  });
}

function showAboutDialog() {
  app.focus();
  dialog.showMessageBox({
    type: 'question',
    buttons: [i18n.get('ok')],
    title: i18n.get('aboutDialogTitle'),
    message: `${i18n.get('version')}: ${version}`,
  });
}

function killServer() {
  const proc = server.getQtumProcess();
  if (proc) {
    try {
      getLogger().debug('Killing process', proc.pid);
      proc.kill();
    } catch (err) {
      getLogger().error(`Error killing process ${proc.pid}:`, err);
    }
  }
}

function exit(signal) {
  getLogger().info(`Received ${signal}, exiting`);
  killServer();
  app.quit();
}

/* Electron Events */

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Must wait for app ready before app.getLocale() on Windows
  i18n = require('./src/localization/i18n');
  showSelectEnvDialog();
});

// Emitted when the application is activated.
app.on('activate', () => {
  getLogger().debug('activate');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (uiWin === null) {
    createWindow();
  }
});

// Emitted when all windows have been closed.
app.on('window-all-closed', () => {
  getLogger().debug('window-all-closed');
});

// Emitted before the application starts closing its windows.
app.on('before-quit', () => {
  getLogger().debug('before-quit');
  killServer();
});

/* Emitter Events */

// Load UI when services are running
emitter.once(ipcEvent.SERVICES_RUNNING, () => {
  if (uiWin) {
    uiWin.maximize();
    uiWin.loadURL(`http://${Config.HOSTNAME}:${Config.PORT}`);
  }
});

// Show error dialog if any startup errors
emitter.on(ipcEvent.STARTUP_ERROR, (err) => {
  dialog.showMessageBox({
    type: 'error',
    buttons: [i18n.get('quit')],
    title: i18n.get('error'),
    message: err,
  }, (response) => {
    exit();
  });
});

// Show wallet unlock prompt if wallet is encrypted
emitter.on(ipcEvent.SHOW_WALLET_UNLOCK, () => {
  showWalletUnlockPrompt();
});

// Delay, then start qtum-qt
emitter.on(ipcEvent.QTUMD_KILLED, () => {
  setTimeout(() => {
    require('./src/start_wallet');
  }, 4000);
});

getEmitter().on(ipcEvent.WALLET_BACKUP, (event) => {
  const options = {
    title: 'Backup Wallet',
    filters: [
      { name: 'backup', extensions: ['dat'] }
    ]
  }
  dialog.showSaveDialog(options, (filename) => {
    Emitter.emit(ipcEvent.BACKUP_FILE, filename);
  })
});

getEmitter().on(ipcEvent.BACKUP_FILE, async (path) => {
  try {
    if (!_.isUndefined(path)) {
      await require('./server/src/api/wallet').backupWallet({ destination: path });
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

getEmitter().on(ipcEvent.WALLET_IMPORT, (event) => {
  dialog.showOpenDialog({
    properties: ['openFile']
  }, (files) => {
    if (files) {
      Emitter.emit(ipcEvent.RESTORE_FILE, files)
    }
  })
})

getEmitter().on(ipcEvent.RESTORE_FILE, async (path) => {
  try {
    if (!_.isEmpty(path)) {
      await require('./server/src/api/wallet').importWallet({ filename: path[0] });
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

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);
