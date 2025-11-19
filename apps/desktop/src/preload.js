const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

const DESKTOP_READY_EVENT = 'promptvault-desktop-ready';

const desktopApi = {
  version: getAppVersion(),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('desktop:toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('desktop:get-always-on-top'),
  onAlwaysOnTopChanged: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('desktop:always-on-top', handler);
    return () => ipcRenderer.removeListener('desktop:always-on-top', handler);
  },
  setOpacity: (value) => ipcRenderer.invoke('desktop:set-opacity', value),
  getOpacity: () => ipcRenderer.invoke('desktop:get-opacity'),
  onOpacityChanged: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('desktop:opacity', handler);
    return () => ipcRenderer.removeListener('desktop:opacity', handler);
  },
  minimizeWindow: () => ipcRenderer.invoke('desktop:minimize'),
  closeWindow: () => ipcRenderer.invoke('desktop:close')
};

contextBridge.exposeInMainWorld('desktop', desktopApi);

try {
  window.desktop = desktopApi;
  window.promptvaultDesktopReady = true;
  window.dispatchEvent(new CustomEvent(DESKTOP_READY_EVENT, { detail: { version: desktopApi.version } }));
} catch (err) {
  console.error('Failed to dispatch desktop ready event', err);
}

function getAppVersion() {
  try {
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const pkg = require(pkgPath);
    return pkg.version;
  } catch {
    return 'dev';
  }
}
