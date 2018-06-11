const _ = require('lodash');
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const prompt = require('electron-prompt');
const restify = require('restify');
const path = require('path');
const os = require('os');

const { version, testnetOnly, encryptOk } = require('./package.json');
const { Config } = require('./src/config/config');

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
    // getLogger().debug('uiWin closed');
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

function loadUI() {
  const server = restify.createServer({ title: 'Bodhi Restify' });
  server.use(restify.plugins.bodyParser({ mapParams: true }));
  server.use(restify.plugins.queryParser());

  // const cors = corsMiddleware({ origins: ['*'] });
  // server.pre(cors.preflight);
  // server.use(cors.actual);
  
  server.on('after', (req, res, route, err) => {
    // if (route) {
    //   getLogger().debug(`${route.methods[0]} ${route.spec.path} ${res.statusCode}`);
    // } else {
    //   getLogger().error(`${err.message}`);
    // }
  });

  server.listen(Config.PORT, () => {
  //   SubscriptionServer.create(
  //     { execute, subscribe, schema },
  //     { server, path: '/subscriptions' },
  //   );
    // getLogger().info(`Bodhi API is running at http://${Config.HOSTNAME}:${Config.PORT}.`);
  });

  // Host static files
  server.get(/\/?.*/, restify.plugins.serveStatic({
    directory: path.join(__dirname, './ui'),
    default: 'index.html',
    maxAge: 0,
  }));

  // Load static website
  uiWin.maximize();
  uiWin.loadURL(`http://${Config.HOSTNAME}:${Config.PORT}`);
}

// Init BrowserWindow with loading page
function initBrowserWindow() {
  if (_.includes(process.argv, '--noui')) {
    return;
  }

  createWindow();
  setupMenu();
  loadUI();
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
          initBrowserWindow();
          // Tracking.mainnetStart();
        }
        break;
      }
      case TESTNET: {
        initBrowserWindow();
        // Tracking.testnetStart();
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
  // getLogger().info(`Received ${signal}, exiting`);
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
  // getLogger().debug('activate');
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (uiWin === null) {
    createWindow();
  }
});

// Emitted when all windows have been closed.
app.on('window-all-closed', () => {
  // getLogger().debug('window-all-closed');
});

// Emitted before the application starts closing its windows.
app.on('before-quit', () => {
  // getLogger().debug('before-quit');
});
