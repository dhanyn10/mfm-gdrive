/**
 * The preload script runs before the renderer process is loaded.
 * It has access to web APIs as well as Electron's renderer process modules
 * and some polyfilled Node.js functions.
 *
 * This script is used to securely expose specific Node.js functionalities
 * to the renderer process, following Electron's security best practices
 * when contextIsolation is enabled (though it's currently disabled in this project).
 *
 * See: https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { ipcRenderer } = require('electron');

// Expose a limited set of IPC functions to the renderer process.
// This is a secure way to allow communication between the main and renderer processes.
window.electronAPI = {
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  checkAuth: () => ipcRenderer.invoke('check-auth'),
  authorize: () => ipcRenderer.send('authorize'),
  getFolders: (parentId, pageToken, customTimeout) => ipcRenderer.invoke('get-folders', parentId, pageToken, customTimeout),
  searchFolders: (query, pageToken) => ipcRenderer.invoke('search-folders', query, pageToken),
  getFiles: (folderId, pageToken, customTimeout) => ipcRenderer.invoke('get-files', folderId, pageToken, customTimeout),
  executeOperation: (operation, params, files) => ipcRenderer.invoke('execute-operation', operation, params, files),
  undoRename: (fileId, oldName) => ipcRenderer.invoke('undo-rename', fileId, oldName),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  showSubmenu: (label, x, y) => ipcRenderer.send('show-submenu', label, x, y),

  // Event Listeners from Main to Renderer
  onUpdateStatus: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  },
  onAuthSuccess: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('auth-success', handler);
    return () => ipcRenderer.removeListener('auth-success', handler);
  },
  onAuthRequired: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('auth-required', handler);
    return () => ipcRenderer.removeListener('auth-required', handler);
  },
  onOperationComplete: (callback) => {
    const handler = (_event, msg) => callback(msg);
    ipcRenderer.on('operation-complete', handler);
    return () => ipcRenderer.removeListener('operation-complete', handler);
  },
};
