const _ = require('lodash');
const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');

// Keep track of all child processes ids
let pids = [];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let uiWin;
let bgWin;

function createWindow () {
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

  uiWin.once('did-finish-load', () => {
    console.log('uiWin did finish load');
  });
  uiWin.once('ready-to-show', () => {
    console.log('uiWin ready to show');
  });

  uiWin.loadURL('http://127.0.0.1:5555');

  // Open the DevTools.
  // uiWin.webContents.openDevTools()

  // console.log('ipcMain', ipcMain);
}

function createBackgroundWindow() {
  // Init background window to create renderer process
  bgWin = new BrowserWindow({ 
    show: false,
    focusable: false,
    skipTaskbar: true,
  });
  
  bgWin.once('ready-to-show', () => {
    console.log('bgWin ready to show');
  });

  bgWin.loadURL(url.format({
    pathname: path.join(__dirname, '/src/bg.html'),
    protocol: 'file:',
    slashes: true
  }));
}

// Save child process ids when receiving it from ipcRenderer
ipcMain.on('pid-message', function(event, arg) {
  console.log('Main:', arg);
  pids.push(arg);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  console.log('app ready');
  createWindow();
  createBackgroundWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
  // TODO: kill child processes
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (uiWin === null) {
    createWindow();
  }
});

app.on('before-quit', function() {
  _.each(pids, (pid) => {
    ps.kill(pid, function(err) {
      if (err) {
        throw new Error( err );
      } else {
        console.log( 'Process %s has been killed!', pid );
      }
    });
  })
});
