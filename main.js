const _ = require('lodash');
const { app, BrowserWindow, ipcMain } = require('electron');

// Keep track of all child processes ids
let pids = [];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 10000,
    height: 10000,
  });

  win.loadURL('http://127.0.0.1:5555');

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  });
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
  createWindow();
  require('./src/index');
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
  // TODO: kill child processes
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
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
