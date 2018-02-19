class IpcUtil {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  newProcess(pid) {
    ipcRenderer.send('new-process', pid);
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
