// main.js

// Modules to control application life and create native browser window.
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';

// Define menu templates
const menuTemplates: Record<string, any[]> = {
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
                await shell.openExternal('https://electronjs.org');
            }
        }
    ]
};

/**
 * Creates and configures the main browser window of the application.
 */
function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, '../../assets/icon.png'), // Adjusted path
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#FFF',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false, // Must be false for nodeIntegration to work.
            nodeIntegration: true,   // Allow Node.js integration in the renderer process.
        },
    });

    // Load the UI
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../../dist-vite/index.html'));
    }

    // Uncomment to open the DevTools automatically.
    // mainWindow.webContents.openDevTools({ mode: 'bottom' });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // IPC handler to provide the user data path to the renderer process.
    // This is used for storing persistent data like authentication tokens.
    ipcMain.handle('get-user-data-path', () => {
        return app.getPath('userData');
    });

    // IPC handler to determine the base path for the local token.
    // In development, it's the project root.
    // In a packaged app, it's the directory containing the executable.
    ipcMain.handle('get-local-token-base-path', () => {
        return app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath();
    });

    // IPC handlers for window controls
    ipcMain.on('minimize-window', (event: any) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) window.minimize();
    });

    ipcMain.on('maximize-window', (event: any) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
            if (window.isMaximized()) {
                window.unmaximize();
            } else {
                window.maximize();
            }
        }
    });

    ipcMain.on('close-window', (event: any) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) window.close();
    });

    // Handler for specific submenu popup
    ipcMain.on('show-submenu', (event: any, menuLabel: string, x: number, y: number) => {
        const template = menuTemplates[menuLabel];
        if (template) {
            const menu = Menu.buildFromTemplate(template);
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) menu.popup({ window, x, y });
        }
    });

    createWindow();

    app.on('activate', function () {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

import { authorize, getFolders, getFiles, renameFile } from './driveApi';
import { sliceText, padText } from './fileOperations';

// Drive APIs
ipcMain.handle('check-auth', async () => {
    try {
        await authorize(null);
        return true;
    } catch (error) {
        return false;
    }
});

ipcMain.on('authorize', async (event: any) => {
    try {
        await authorize(event);
        event.sender.send('auth-success');
    } catch (error: any) {
        event.sender.send('update-status', `Auth Error: ${error.message}`, error.code);
    }
});

ipcMain.handle('get-folders', async (event: any, parentId: string = 'root', pageToken: string | null = null, customTimeout: number | null = null) => {
    try {
        const result = await getFolders(parentId, pageToken, customTimeout);
        return {
             folders: result.folders.map((f: any) => ({ id: f.id, name: f.name, parents: f.parents })),
             nextPageToken: result.nextPageToken
        };
    } catch (error: any) {
        console.error("Error getting folders", error);
        return { folders: [], nextPageToken: null, error: error.message, errorCode: error.code };
    }
});

ipcMain.handle('get-files', async (event: any, folderId: string = 'root', pageToken: string | null = null, customTimeout: number | null = null) => {
    try {
        const result = await getFiles(folderId, pageToken, customTimeout);
        return {
            files: result.files.map((f: any) => ({ id: f.id, name: f.name })),
            nextPageToken: result.nextPageToken
        };
    } catch (error: any) {
        console.error("Error getting files", error);
        return { files: [], nextPageToken: null, error: error.message, errorCode: error.code };
    }
});

ipcMain.handle('execute-operation', async (event: any, operation: string, params: any, files: any[]) => {
    if (!files || files.length === 0) return [];

    let updatedFiles: any[] = [];
    try {
        for (const file of files) {
            let newName = file.name;
            if (operation === 'replace') {
                newName = file.name.replace(new RegExp(params.search, 'g'), params.replace || '');
            } else if (operation === 'slice') {
                newName = sliceText(file.name, params.start, params.end);
            } else if (operation === 'pad') {
                newName = padText(file.name, params.count, params.char, params.position);
            }

            if (newName !== file.name) {
                const renamed = await renameFile(file.id, newName);
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
    } catch (error: any) {
        console.error("Error executing operation:", error);
        return { error: error.message, errorCode: error.code };
    }
});

ipcMain.handle('undo-rename', async (event: any, fileId: string, oldName: string) => {
    try {
        const renamed = await renameFile(fileId, oldName);
        if (renamed) {
            return true;
        }
        return false;
    } catch (error: any) {
        console.error("Error undoing rename:", error);
        event.sender.send('update-status', `Failed to undo rename: ${error.message}`);
        return false;
    }
});
