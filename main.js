const _ = require('lodash');
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');

const { Config } = require('./src/config/config');
const logger = require('./src/utils/logger');
const { environment, ipcEvent } = require('./src/constants');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let uiWin;
let server;
let env;

function createWindow() {
  // Create the browser window.
  uiWin = new BrowserWindow({
    width: 10000,
    height: 10000,
  });

  uiWin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    uiWin = null
  });

  uiWin.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
}

function setupMenu() {
  const template = [
    {
      label: "Application",
      submenu: [
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

function initApp() {
  // If --noelec flag is supplied, don't open any Electron windows
  if (_.includes(process.argv, '--noelec')) {
    return;
  }

  // Init BrowserWindow
  createWindow();
  setupMenu();

  // Load intermediary loading page
  uiWin.loadURL(`file://${__dirname}/ui/html/loading/index.html`);

  // Load app main page when qtumd is fully initialized
  server.emitter.once(ipcEvent.QTUMD_STARTED, () => {
    uiWin.loadURL(`http://${Config.HOSTNAME}:${Config.PORT}`);
  });

  // Show error dialog if any startup errors
  server.emitter.on(ipcEvent.STARTUP_ERROR, (err) => {
    dialog.showMessageBox({
      type: 'error',
      buttons: ['Quit'],
      title: 'Error',
      message: err,
    }, (response) => {
      killServer();
      app.quit();
    });
  });
}

function killServer() {
  if (server && server.process) {
    try {
      logger.debug('Killing process', server.process.pid);
      server.process.kill();
    } catch (err) {
      logger.error(`Error killing process ${server.process.pid}:`, err);
    }
  }
}

function exit(signal) {
  logger.info(`Received ${signal}, exiting`);
  killServer();
  app.quit();
}

/* IPC Messages */
ipcMain.on('log-info', (event, arg) => {
  logger.info(arg);
});

ipcMain.on('log-debug', (event, arg) => {
  logger.debug(arg);
});

ipcMain.on('log-error', (event, arg) => {
  logger.error(arg);
});

/* App Events */
// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Show environment selection dialog
  dialog.showMessageBox({
    type: 'question',
    buttons: ['Mainnet', 'Testnet'],
    title: 'Select Environment',
    message: 'Please select the environment.',
  }, (response) => {
    // Set env var so sync knows which flags to add on startup
    if (response === 0) {
      console.log('Environment: Mainnet');
      env = environment.MAINNET;
    } else {
      console.log('Environment: Testnet');
      env = environment.TESTNET;
    }

    // Start server and init Electron windows
    server = require('./src/index');
    initApp();
  });
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

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
process.on('SIGHUP', exit);
