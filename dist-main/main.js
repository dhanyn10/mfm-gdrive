"use strict";
// main.js
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Modules to control application life and create native browser window.
const electron_1 = require("electron");
const path = __importStar(require("path"));
// Define menu templates
const menuTemplates = {
    'File': [
        { role: 'quit' }
    ],
    'View': [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
    ],
    'Window': [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
    ],
    'Help': [
        {
            label: 'Learn More',
            click: async () => {
                await electron_1.shell.openExternal('https://electronjs.org');
            }
        }
    ]
};
/**
 * Creates and configures the main browser window of the application.
 */
function createWindow() {
    // Create the browser window.
    const mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, '../../assets/icon.png'), // Adjusted path
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#FFF',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false, // Must be false for nodeIntegration to work.
            nodeIntegration: true, // Allow Node.js integration in the renderer process.
        },
    });
    // Load the UI
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../../dist-vite/index.html'));
    }
    // Uncomment to open the DevTools automatically.
    // mainWindow.webContents.openDevTools({ mode: 'bottom' });
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.whenReady().then(() => {
    // IPC handler to provide the user data path to the renderer process.
    // This is used for storing persistent data like authentication tokens.
    electron_1.ipcMain.handle('get-user-data-path', () => {
        return electron_1.app.getPath('userData');
    });
    // IPC handler to determine the base path for the local token.
    // In development, it's the project root.
    // In a packaged app, it's the directory containing the executable.
    electron_1.ipcMain.handle('get-local-token-base-path', () => {
        return electron_1.app.isPackaged ? path.dirname(electron_1.app.getPath('exe')) : electron_1.app.getAppPath();
    });
    // IPC handlers for window controls
    electron_1.ipcMain.on('minimize-window', (event) => {
        const window = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (window)
            window.minimize();
    });
    electron_1.ipcMain.on('maximize-window', (event) => {
        const window = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (window) {
            if (window.isMaximized()) {
                window.unmaximize();
            }
            else {
                window.maximize();
            }
        }
    });
    electron_1.ipcMain.on('close-window', (event) => {
        const window = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (window)
            window.close();
    });
    // Handler for specific submenu popup
    electron_1.ipcMain.on('show-submenu', (event, menuLabel, x, y) => {
        const template = menuTemplates[menuLabel];
        if (template) {
            const menu = electron_1.Menu.buildFromTemplate(template);
            const window = electron_1.BrowserWindow.fromWebContents(event.sender);
            if (window)
                menu.popup({ window, x, y });
        }
    });
    createWindow();
    electron_1.app.on('activate', function () {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const driveApi_1 = require("./driveApi");
const fileOperations_1 = require("./fileOperations");
// Drive APIs
electron_1.ipcMain.handle('check-auth', async () => {
    try {
        await (0, driveApi_1.authorize)(null);
        return true;
    }
    catch (error) {
        return false;
    }
});
electron_1.ipcMain.on('authorize', async (event) => {
    try {
        await (0, driveApi_1.authorize)(event);
        event.sender.send('auth-success');
    }
    catch (error) {
        event.sender.send('update-status', `Auth Error: ${error.message}`, error.code);
    }
});
electron_1.ipcMain.handle('get-folders', async (event, parentId = 'root', pageToken = null, customTimeout = null) => {
    try {
        const result = await (0, driveApi_1.getFolders)(parentId, pageToken, customTimeout);
        return {
            folders: result.folders.map((f) => ({ id: f.id, name: f.name, parents: f.parents })),
            nextPageToken: result.nextPageToken
        };
    }
    catch (error) {
        console.error("Error getting folders", error);
        return { folders: [], nextPageToken: null, error: error.message, errorCode: error.code };
    }
});
electron_1.ipcMain.handle('get-files', async (event, folderId = 'root', pageToken = null, customTimeout = null) => {
    try {
        const result = await (0, driveApi_1.getFiles)(folderId, pageToken, customTimeout);
        return {
            files: result.files.map((f) => ({ id: f.id, name: f.name })),
            nextPageToken: result.nextPageToken
        };
    }
    catch (error) {
        console.error("Error getting files", error);
        return { files: [], nextPageToken: null, error: error.message, errorCode: error.code };
    }
});
electron_1.ipcMain.handle('execute-operation', async (event, operation, params, files) => {
    if (!files || files.length === 0)
        return [];
    let updatedFiles = [];
    try {
        for (const file of files) {
            let newName = file.name;
            if (operation === 'replace') {
                newName = file.name.replace(new RegExp(params.search, 'g'), params.replace || '');
            }
            else if (operation === 'slice') {
                newName = (0, fileOperations_1.sliceText)(file.name, params.start, params.end);
            }
            else if (operation === 'pad') {
                newName = (0, fileOperations_1.padText)(file.name, params.count, params.char, params.position);
            }
            if (newName !== file.name) {
                const renamed = await (0, driveApi_1.renameFile)(file.id, newName);
                if (renamed) {
                    updatedFiles.push({ id: file.id, newName: newName });
                    event.sender.send('operation-complete', { newName, oldName: file.name, fileId: file.id });
                }
            }
        }
        if (updatedFiles.length === 0) {
            event.sender.send('update-status', `No files needed changes.`);
        }
        return updatedFiles;
    }
    catch (error) {
        console.error("Error executing operation:", error);
        return { error: error.message, errorCode: error.code };
    }
});
electron_1.ipcMain.handle('undo-rename', async (event, fileId, oldName) => {
    try {
        const renamed = await (0, driveApi_1.renameFile)(fileId, oldName);
        if (renamed) {
            return true;
        }
        return false;
    }
    catch (error) {
        console.error("Error undoing rename:", error);
        event.sender.send('update-status', `Failed to undo rename: ${error.message}`);
        return false;
    }
});
