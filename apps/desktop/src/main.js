const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;
const staticEntry = path.resolve(__dirname, '../static/index.html');
const defaultAlwaysOnTop = process.env.PROMPTVAULT_ALWAYS_ON_TOP === 'true';
const clampOpacity = (value) => {
  const normalized = Number.isFinite(value) ? value : 1;
  return Math.min(1, Math.max(0.4, normalized));
};
const defaultOpacity = clampOpacity(Number(process.env.PROMPTVAULT_OPACITY ?? '1'));

let mainWindow;

async function createWindow() {
  const display = screen.getPrimaryDisplay();
  const workArea = display?.workArea ?? { x: 0, y: 0, width: 1920, height: 1080 };
  const workAreaSize = display?.workAreaSize ?? { width: workArea.width, height: workArea.height };
  const calculatedWidth = workAreaSize.width ? Math.floor(workAreaSize.width / 4) : 480;
  const windowWidth = Math.max(480, calculatedWidth);
  const windowHeight = Math.min(1080, workAreaSize.height || 1080);
  const positionX = workArea.x + Math.max(0, workArea.width - windowWidth);
  const positionY = workArea.y;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.round(positionX),
    y: Math.round(positionY),
    alwaysOnTop: defaultAlwaysOnTop,
    autoHideMenuBar: true,
    frame: false,
    minWidth: 360,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.resolve(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden'
  });

  mainWindow.setOpacity(defaultOpacity);
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    await mainWindow.loadFile(staticEntry);
  }

  mainWindow.webContents.once('did-finish-load', () => {
    if (!mainWindow) return;
    mainWindow.webContents.send('desktop:always-on-top', mainWindow.isAlwaysOnTop());
    mainWindow.webContents.send('desktop:opacity', mainWindow.getOpacity());
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('desktop:toggle-always-on-top', () => {
  if (!mainWindow) {
    return false;
  }
  const nextValue = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(nextValue);
  mainWindow.webContents.send('desktop:always-on-top', nextValue);
  return nextValue;
});

ipcMain.handle('desktop:get-always-on-top', () => mainWindow?.isAlwaysOnTop?.() ?? false);
ipcMain.handle('desktop:set-opacity', (_event, value) => {
  if (!mainWindow) return 1;
  const normalized = clampOpacity(Number(value));
  mainWindow.setOpacity(normalized);
  mainWindow.webContents.send('desktop:opacity', normalized);
  return normalized;
});
ipcMain.handle('desktop:get-opacity', () => mainWindow?.getOpacity?.() ?? 1);
ipcMain.handle('desktop:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});
ipcMain.handle('desktop:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
