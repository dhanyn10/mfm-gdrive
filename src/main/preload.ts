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
import { ipcRenderer } from 'electron';

// Expose a limited set of IPC functions to the renderer process.
// This is a secure way to allow communication between the main and renderer processes.
(window as any).electronAPI = {
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  checkAuth: () => ipcRenderer.invoke('check-auth'),
  authorize: () => ipcRenderer.send('authorize'),
  getFolders: (parentId?: string, pageToken?: string | null, customTimeout?: number | null) => ipcRenderer.invoke('get-folders', parentId, pageToken, customTimeout),
  getFiles: (folderId?: string, pageToken?: string | null, customTimeout?: number | null) => ipcRenderer.invoke('get-files', folderId, pageToken, customTimeout),
  executeOperation: (operation: string, params: any, files: any[]) => ipcRenderer.invoke('execute-operation', operation, params, files),
  undoRename: (fileId: string, oldName: string) => ipcRenderer.invoke('undo-rename', fileId, oldName),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  showSubmenu: (label: string, x: number, y: number) => ipcRenderer.send('show-submenu', label, x, y),

  // Event Listeners from Main to Renderer
  onUpdateStatus: (callback: (value: any) => void) => {
    const handler = (_event: any, value: any) => callback(value);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  },
  onAuthSuccess: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('auth-success', handler);
    return () => ipcRenderer.removeListener('auth-success', handler);
  },
  onOperationComplete: (callback: (msg: any) => void) => {
    const handler = (_event: any, msg: any) => callback(msg);
    ipcRenderer.on('operation-complete', handler);
    return () => ipcRenderer.removeListener('operation-complete', handler);
  },
};
