const _ = require('lodash');
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const prompt = require('electron-prompt');

const server = require('./src/index');
const { Config, setQtumEnv, getQtumExplorerUrl } = require('./src/config/config');
const logger = require('./src/utils/logger');
const { blockchainEnv, ipcEvent } = require('./src/constants');
const Tracking = require('./src/analytics/tracking');
const Utils = require('./src/utils/utils');
const Wallet = require('./src/api/wallet');

const EXPLORER_URL_PLACEHOLDER = 'https://qtumhost';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let uiWin;
let i18n;

function startServer() {
  server.startQtumProcess(false);
}

function createWindow() {
  // Create the browser window.
  uiWin = new BrowserWindow({
    width: 10000,
    height: 10000,
    webPreferences: {
      nativeWindowOpen: true,
    },
  });

  uiWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    uiWin = null
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

function initUiWin() {
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
  }, (response) => {
    switch (response) {
      case 0: {
        logger.info('Choose Mainnet');

        setQtumEnv(blockchainEnv.MAINNET);
        startServer();
        initUiWin();

        Tracking.mainnetStart();
        break;
      }
      case 1: {
        logger.info('Choose Testnet');
        
        setQtumEnv(blockchainEnv.TESTNET);
        startServer();
        initUiWin();

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
  dialog.showMessageBox({
    type: 'error',
    buttons: [i18n.get('quit')],
    title: i18n.get('error'),
    message,
  }, (response) => {
    app.quit();
  });
}

function showWalletUnlockPrompt() {
  prompt({
    title: i18n.get('unlockWallet'),
    label: i18n.get('enterYourWalletPassphrase'),
    value: '',
    type: 'input',
  }).then(async (res) => {
    // null if window was closed, or user clicked Cancel
    if (res === null) {
      app.quit();
    } else {
      // Unlock wallet
      await Wallet.walletPassphrase({ passphrase: res, timeout: Config.UNLOCK_SECONDS });
      const info = await Wallet.getWalletInfo();
      if (info.unlocked_until > 0) {
        logger.info('Wallet unlocked');
        server.startServices();
      } else {
        logger.error('Wallet unlock failed');
        showWalletErrorDialog(i18n.get('walletUnlockFailed'));
      }
    }
  }).catch((err) => {
    logger.error(err.message);
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
      // TODO: ADD FLAG FOR QTUMD RUNNING
      if (server) {
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

function killServer() {
  const proc = server.getQtumProcess();
  if (proc) {
    try {
      logger.debug('Killing process', proc.pid);
      proc.kill();
    } catch (err) {
      logger.error(`Error killing process ${proc.pid}:`, err);
    }
  }
}

function exit(signal) {
  logger.info(`Received ${signal}, exiting`);
  killServer();
  app.quit();
}

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Must wait for app ready before app.getLocale() on Windows
  i18n = require('./src/localization/i18n');
  showSelectEnvDialog();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  logger.debug('window-all-closed');
  killServer();
  app.quit();
});

app.on('activate', () => {
  logger.debug('activate');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (uiWin === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  logger.debug('before-quit');
  killServer();
});

// Load app main page when qtumd is fully initialized
server.emitter.once(ipcEvent.QTUMD_STARTED, () => {
  if (uiWin) {
    uiWin.loadURL(`http://${Config.HOSTNAME}:${Config.PORT}`);
  }
});

// Show error dialog if any startup errors
server.emitter.on(ipcEvent.STARTUP_ERROR, (err) => {
  dialog.showMessageBox({
    type: 'error',
    buttons: [i18n.get('quit')],
    title: i18n.get('error'),
    message: err,
  }, (response) => {
    killServer();
    app.quit();
  });
});

// Show wallet unlock prompt if wallet is encrypted
server.emitter.on(ipcEvent.SHOW_WALLET_UNLOCK, () => {
  showWalletUnlockPrompt();
});

// Delay, then start qtum-qt
server.emitter.on(ipcEvent.QTUMD_KILLED, () => {
  setTimeout(() => {
    require('./src/start_wallet');
  }, 4000);
});

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);
