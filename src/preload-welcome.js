const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('welcomeAPI', {
  dismissWelcome: () => ipcRenderer.invoke('dismiss-welcome'),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  saveShortcut: (shortcut) => ipcRenderer.invoke('save-main-shortcut', shortcut),
  getMainShortcut: () => ipcRenderer.invoke('get-main-shortcut'),
  getUiLocale: () => ipcRenderer.invoke('get-ui-locale'),
  getTemplatesRoot: () => ipcRenderer.invoke('get-templates-root'),
  chooseTemplatesRoot: () => ipcRenderer.invoke('choose-templates-root')
});
