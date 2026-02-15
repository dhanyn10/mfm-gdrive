// main.js

// Modules to control application life and create native browser window.
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

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
                const { shell } = require('electron');
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
        icon: path.join(__dirname, 'assets/icon.png'),
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#FFF',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false, // Must be false for nodeIntegration to work.
            nodeIntegration: true,   // Allow Node.js integration in the renderer process.
        },
    });

    // Load the index.html file of the app.
    mainWindow.loadFile('index.html');

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
    ipcMain.on('minimize-window', (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    });

    ipcMain.on('maximize-window', (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window.isMaximized()) {
            window.unmaximize();
        } else {
            window.maximize();
        }
    });

    ipcMain.on('close-window', (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.close();
    });

    // Handler for specific submenu popup
    ipcMain.on('show-submenu', (event, menuLabel, x, y) => {
        const template = menuTemplates[menuLabel];
        if (template) {
            const menu = Menu.buildFromTemplate(template);
            menu.popup({ window: BrowserWindow.fromWebContents(event.sender), x, y });
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
