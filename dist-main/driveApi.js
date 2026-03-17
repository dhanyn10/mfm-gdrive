"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
exports.getFolders = getFolders;
exports.getFiles = getFiles;
exports.renameFile = renameFile;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const local_auth_1 = require("@google-cloud/local-auth");
const googleapis_1 = require("googleapis");
const bottleneck_1 = __importDefault(require("bottleneck"));
const electron_1 = require("electron");
// Set global timeout for Google APIs to 30 seconds
googleapis_1.google.options({ timeout: 10000 });
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];
let TOKEN_PATH;
let LOCAL_TOKEN_PATH;
let CREDENTIALS_PATH;
const limiter = new bottleneck_1.default({ minTime: 110 });
async function initializePaths() {
    if (TOKEN_PATH)
        return;
    const userDataPath = electron_1.app.getPath('userData');
    const localTokenBasePath = electron_1.app.isPackaged ? path.dirname(electron_1.app.getPath('exe')) : electron_1.app.getAppPath();
    TOKEN_PATH = path.join(userDataPath, 'token.json');
    CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
    LOCAL_TOKEN_PATH = path.join(localTokenBasePath, 'token.json');
}
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs_1.promises.readFile(LOCAL_TOKEN_PATH, 'utf-8').catch(() => {
            return fs_1.promises.readFile(TOKEN_PATH, 'utf-8');
        });
        if (content) {
            const credentials = JSON.parse(content);
            return googleapis_1.google.auth.fromJSON(credentials);
        }
    }
    catch (err) {
        console.log('No valid token found in user data or local directory.');
    }
    return null;
}
async function saveCredentials(client) {
    const content = await fs_1.promises.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs_1.promises.writeFile(TOKEN_PATH, payload);
}
// Helper to detect network errors
function isNetworkError(error) {
    if (!error)
        return false;
    const msg = error.message || '';
    const code = error.code || '';
    return msg.includes('ETIMEDOUT') || code === 'ETIMEDOUT' ||
        msg.includes('ENOTFOUND') || code === 'ENOTFOUND' ||
        msg.includes('ECONNREFUSED') || code === 'ECONNREFUSED' ||
        msg.includes('ECONNRESET') || code === 'ECONNRESET';
}
function throwNetworkError(contextMsg) {
    const err = new Error(`${contextMsg} Please check your internet connection.`);
    err.code = 'NETWORK_ERROR';
    throw err;
}
// Keep an active client instance so we don't have to re-auth on every request
let _driveClient = null;
async function authorize(event) {
    await initializePaths();
    let client;
    try {
        client = await loadSavedCredentialsIfExist();
    }
    catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while loading saved credentials.");
        }
        throw error;
    }
    if (client) {
        _driveClient = googleapis_1.google.drive({ version: 'v3', auth: client });
        return _driveClient;
    }
    if (event) {
        try {
            client = await (0, local_auth_1.authenticate)({
                scopes: SCOPES,
                keyfilePath: CREDENTIALS_PATH,
            });
        }
        catch (error) {
            if (isNetworkError(error)) {
                throwNetworkError("Connection failed while authenticating.");
            }
            throw error;
        }
        if (client.credentials) {
            await saveCredentials(client);
            _driveClient = googleapis_1.google.drive({ version: 'v3', auth: client });
            return _driveClient;
        }
    }
    throw new Error("Not authorized");
}
async function getFolders(parentId = 'root', pageToken = null, customTimeout = null) {
    if (!_driveClient)
        await authorize(null);
    try {
        const response = await limiter.schedule(() => _driveClient.files.list({
            pageSize: 100, // Fetch in reasonable chunks
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'nextPageToken, files(id, name, parents)',
            orderBy: 'name',
            pageToken: pageToken
        }, customTimeout ? { timeout: customTimeout } : {}));
        return {
            folders: response.data.files || [],
            nextPageToken: response.data.nextPageToken || null
        };
    }
    catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while fetching folders.");
        }
        throw error;
    }
}
async function getFiles(parentId = 'root', pageToken = null, customTimeout = null) {
    if (!_driveClient)
        await authorize(null);
    try {
        const response = await limiter.schedule(() => _driveClient.files.list({
            pageSize: 300, // Fetch in reasonable chunks
            q: `'${parentId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'nextPageToken, files(id, name)',
            orderBy: 'name',
            pageToken: pageToken
        }, customTimeout ? { timeout: customTimeout } : {}));
        return {
            files: response.data.files || [],
            nextPageToken: response.data.nextPageToken || null
        };
    }
    catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while fetching files.");
        }
        throw error;
    }
}
async function renameFile(fileId, newTitle) {
    if (!_driveClient)
        await authorize(null);
    const body = { 'name': newTitle };
    try {
        const response = await limiter.schedule(() => _driveClient.files.update({
            fileId: fileId,
            resource: body
        }));
        return response.data;
    }
    catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while renaming file.");
        }
        throw error;
    }
}
