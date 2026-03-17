"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const electron_1 = require("electron");
// Expose a limited set of IPC functions to the renderer process.
// This is a secure way to allow communication between the main and renderer processes.
window.electronAPI = {
    getUserDataPath: () => electron_1.ipcRenderer.invoke('get-user-data-path'),
    checkAuth: () => electron_1.ipcRenderer.invoke('check-auth'),
    authorize: () => electron_1.ipcRenderer.send('authorize'),
    getFolders: (parentId, pageToken, customTimeout) => electron_1.ipcRenderer.invoke('get-folders', parentId, pageToken, customTimeout),
    getFiles: (folderId, pageToken, customTimeout) => electron_1.ipcRenderer.invoke('get-files', folderId, pageToken, customTimeout),
    executeOperation: (operation, params, files) => electron_1.ipcRenderer.invoke('execute-operation', operation, params, files),
    undoRename: (fileId, oldName) => electron_1.ipcRenderer.invoke('undo-rename', fileId, oldName),
    minimizeWindow: () => electron_1.ipcRenderer.send('minimize-window'),
    maximizeWindow: () => electron_1.ipcRenderer.send('maximize-window'),
    closeWindow: () => electron_1.ipcRenderer.send('close-window'),
    showSubmenu: (label, x, y) => electron_1.ipcRenderer.send('show-submenu', label, x, y),
    // Event Listeners from Main to Renderer
    onUpdateStatus: (callback) => {
        const handler = (_event, value) => callback(value);
        electron_1.ipcRenderer.on('update-status', handler);
        return () => electron_1.ipcRenderer.removeListener('update-status', handler);
    },
    onAuthSuccess: (callback) => {
        const handler = () => callback();
        electron_1.ipcRenderer.on('auth-success', handler);
        return () => electron_1.ipcRenderer.removeListener('auth-success', handler);
    },
    onOperationComplete: (callback) => {
        const handler = (_event, msg) => callback(msg);
        electron_1.ipcRenderer.on('operation-complete', handler);
        return () => electron_1.ipcRenderer.removeListener('operation-complete', handler);
    },
};
