const _ = require('lodash');
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const prompt = require('electron-prompt');
const express = require('express');
const path = require('path');
const os = require('os');

const { version, testnetOnly, encryptOk } = require('./package.json');
const Tracking = require('./src/analytics/tracking');
const { getProdQtumExecPath } = require('./src/utils/utils');
const { initDB } = require('./server/src/db/nedb');
const { getQtumProcess, killQtumProcess, startServices, startServer, getServer } = require('./server/src/server');
const EmitterHelper = require('./server/src/utils/emitterHelper');
const { Config, setQtumEnv, getQtumExplorerUrl } = require('./server/src/config/config');
const { getLogger } = require('./server/src/utils/logger');
const { blockchainEnv, ipcEvent, execFile } = require('./server/src/constants');
const { isDevEnv, getDevQtumExecPath } = require('./server/src/utils/utils');
const Wallet = require('./server/src/api/wallet');

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

const UI_PORT = 3000;
const EXPLORER_URL_PLACEHOLDER = 'https://qtumhost';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let uiWin;
let i18n;

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

  if (_.includes(process.argv, '--devtools')) {
    uiWin.webContents.openDevTools();
  }

  // Load intermediary loading page
  uiWin.loadURL(`file://${__dirname}/ui/html/loading/index.html`);
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
      if (getQtumProcess()) {
        killQtumProcess(true);
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

function showDeleteDataDialog() {
  app.focus();

  const [CANCEL, DELETE] = [0, 1];
  dialog.showMessageBox({
    type: 'question',
    buttons: [i18n.get('cancel'), i18n.get('delete')],
    title: i18n.get('deleteDataDialogTitle'),
    message: i18n.get('deleteDataDialogMessage'),
    defaultId: CANCEL,
    cancelId: CANCEL,
  }, (response) => {
    if (response === DELETE) {
      if (getQtumProcess()) {
        
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

function setupMenu() {
  const template = [
    {
      label: "Application",
      submenu: [
        { label: "Launch Qtum Wallet", click: () => showLaunchQtumWalletDialog() },
        { label: "Delete Bodhi Data", click: () => showDeleteDataDialog() },
        { type: "separator" },
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

// Init BrowserWindow with loading page
function initBrowserWindow() {
  if (_.includes(process.argv, '--noui')) {
    return;
  }

  createWindow();
  setupMenu();
}

function loadUI() {
  if (_.includes(process.argv, '--noui')) {
    return;
  }

  // Host React static files
  const app = express();
  app.use(express.static(path.join(__dirname, './ui')));
  app.listen(UI_PORT);

  // Load React app
  uiWin.maximize();
  uiWin.loadURL(`http://localhost:${UI_PORT}`);
}

async function startBackend(blockchainEnv) {
  if (_.isEmpty(blockchainEnv)) {
    throw Error(`blockchainEnv cannot be empty.`);
  }

  // Get qtumd path
  let qtumdPath;
  if (isDevEnv()) {
    qtumdPath = getDevQtumExecPath(execFile.QTUMD);
  } else {
    qtumdPath = getProdQtumExecPath(execFile.QTUMD);
  }
  if (_.isEmpty(qtumdPath)) {
    throw Error(`qtumdPath cannot be empty.`);
  }
  
  await startServer(blockchainEnv, qtumdPath, encryptOk);
  initBrowserWindow();
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
  }, (response) => {
    const [MAINNET, TESTNET, QUIT] = [0, 1, 2];
    switch (response) {
      case MAINNET: {
        if (testnetOnly) { // Testnet-only flag found
          dialog.showMessageBox({
            type: 'info',
            buttons: [],
            title: i18n.get('earlyAccessDialogTitle'),
            message: i18n.get('earlyAccessDialogMessage'),
          });
          showSelectEnvDialog();
        } else { // Mainnet/Testnet allowed
          startBackend(blockchainEnv.MAINNET);
          Tracking.mainnetStart();
        }
        break;
      }
      case TESTNET: {
        startBackend(blockchainEnv.TESTNET);
        Tracking.testnetStart();
        break;
      }
      case QUIT: {
        app.quit();
        return;
      }
      default: {
        throw Error(`Invalid dialog button selection ${response}`);
      }
    }
  });
}

function showErrorDialog(errMessage) {
  dialog.showMessageBox({
    type: 'error',
    buttons: [i18n.get('quit')],
    title: i18n.get('error'),
    message: errMessage,
  }, (response) => {
    exit();
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
    inputAttrs: { type: 'password' },
  }).then(async (res) => {
    // null if window was closed, or user clicked Cancel
    if (res === null) {
      app.quit();
    } else {
      if (_.isEmpty(res)) {
        throw Error('The wallet passphrase entered was incorrect.');
      }

      // Unlock wallet
      await Wallet.walletPassphrase({ passphrase: res, timeout: Config.UNLOCK_SECONDS });
      const info = await Wallet.getWalletInfo();
      if (info.unlocked_until > 0) {
        getLogger().info('Wallet unlocked');
        startServices();
      } else {
        getLogger().error('Wallet unlock failed');
        throw Error(i18n.get('walletUnlockFailed'));
      }
    }
  }).catch((err) => {
    getLogger().error(err.message);
    showWalletErrorDialog(err.message);
  });
}

function startQtWallet() {
  let qtumqtPath;
  if (isDevEnv()) {
    qtumqtPath = getDevQtumExecPath(execFile.QTUM_QT);
  } else {
    qtumqtPath = getProdQtumExecPath(execFile.QTUM_QT);
  }
  if (_.isEmpty(blockchainEnv)) {
    throw Error(`qtumqtPath cannot be empty.`);
  }

  setTimeout(() => require('./server/src/start_wallet').startQtumWallet(qtumqtPath), 4000);
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

function exit(signal) {
  getLogger().info(`Received ${signal}, exiting`);
  killQtumProcess();
  app.quit();
}

// Handle exit signals
process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);

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
  killQtumProcess();
});

/* Emitter Events */
// Show error dialog for any errors from startServer()
EmitterHelper.emitter.on(ipcEvent.SERVER_START_ERROR, (errMessage) => {
  showErrorDialog(errMessage);
});

// Show error dialog for any qtumd start errors
EmitterHelper.emitter.on(ipcEvent.QTUMD_ERROR, (errMessage) => {
  showErrorDialog(errMessage);
});

// Delay, then start qtum-qt
EmitterHelper.emitter.on(ipcEvent.QTUMD_KILLED, () => {
  startQtWallet();
});

// Load UI when services are running
EmitterHelper.emitter.once(ipcEvent.API_INITIALIZED, () => {
  loadUI();
});

// Show wallet unlock prompt if wallet is encrypted
EmitterHelper.emitter.on(ipcEvent.WALLET_ENCRYPTED, () => {
  showWalletUnlockPrompt();
});

// backup-wallet API called
EmitterHelper.emitter.on(ipcEvent.WALLET_BACKUP, (event) => {
  const options = {
    title: 'Backup Wallet',
    filters: [
      { name: 'backup', extensions: ['dat'] }
    ]
  }
  dialog.showSaveDialog(options, async (path) => {
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
  })
});

// import-wallet API called
EmitterHelper.emitter.on(ipcEvent.WALLET_IMPORT, (event) => {
  dialog.showOpenDialog({
    properties: ['openFile']
  }, async (files) => {
    try {
      if (!_.isEmpty(files)) {
        await require('./server/src/api/wallet').importWallet({ filename: files[0] });

        dialog.showMessageBox({
          type: 'info',
          title: 'Information',
          message: i18n.get('importSuccess'),
          buttons: [i18n.get('ok')],
        });
      }
    } catch (err) {
      dialog.showMessageBox({
        type: 'error',
        title: i18n.get('error'),
        message: err.message,
        buttons: [i18n.get('ok')],
      });
    }
  })
});
