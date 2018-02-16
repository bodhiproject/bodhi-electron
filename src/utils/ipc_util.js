class IpcUtil {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  newProcess(pid) {
    ipcRenderer.send('pid-message', pid);
  }

  logInfo(msg) {
    console.log(ipcRenderer);
    ipcRenderer.send('log-info', msg);
  }

  logDebug(msg) {
    ipcRenderer.send('log-debug', msg);
  }

  logError(msg) {
    ipcRenderer.send('log-error', msg);
  }
}

module.exports = IpcUtil;
