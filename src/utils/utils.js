/*
* Gets the prod env qtum path for either qtumd or qtum-qt.
* @param execFile {String} The exec file type needed to be returned.
* return {String} The full prod path for qtumd or qtum-qt.
*/
function getProdQtumExecPath(exec) {
  let path;
  const arch = process.arch;

  switch (process.platform) {
    case 'darwin': {
      switch (exec) {
        case execFile.QTUMD: {
          path = `${app.getAppPath()}/qtum/mac/bin/qtumd`;
          break;
        }
        case execFile.QTUM_QT: {
          path = `${app.getAppPath()}/qtum/mac/bin/qtum-qt`;
          break;
        }
        default: {
          throw new Error(`Invalid execFile type: ${exec}`);
        }
      }
      break;
    }

    case 'win32': {
      if (arch === 'x64') {
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/win64/bin/qtumd.exe`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/win64/bin/qtum-qt.exe`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      } else { // x86 arch
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/win32/bin/qtumd.exe`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/win32/bin/qtum-qt.exe`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      }
      break;
    }

    case 'linux': {
      if (arch === 'x64') {
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/linux64/bin/qtumd`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/linux64/bin/qtum-qt`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      } else if (arch === 'x32') {
        switch (exec) {
          case execFile.QTUMD: {
            path = `${app.getAppPath()}/qtum/linux32/bin/qtumd`;
            break;
          }
          case execFile.QTUM_QT: {
            path = `${app.getAppPath()}/qtum/linux32/bin/qtum-qt`;
            break;
          }
          default: {
            throw new Error(`Invalid execFile type: ${exec}`);
          }
        }
      } else {
        throw new Error(`Linux arch ${arch} not supported`);
      }
      break;
    }

    default: {
      throw new Error('Operating system not supported');
    }
  }

  return path.replace('app.asar', 'app.asar.unpacked');
}

module.exports = {
  getProdQtumExecPath,
};
