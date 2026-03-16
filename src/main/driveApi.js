const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Bottleneck = require('bottleneck');
const { app } = require('electron');

// Set global timeout for Google APIs to 30 seconds
google.options({ timeout: 30000 });

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];

let TOKEN_PATH;
let LOCAL_TOKEN_PATH;
let CREDENTIALS_PATH;

const limiter = new Bottleneck({ minTime: 110 });

async function initializePaths() {
    if (TOKEN_PATH) return;
    const userDataPath = app.getPath('userData');
    const localTokenBasePath = app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath();
    TOKEN_PATH = path.join(userDataPath, 'token.json');
    CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
    LOCAL_TOKEN_PATH = path.join(localTokenBasePath, 'token.json');
}

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(LOCAL_TOKEN_PATH).catch(() => {
            return fs.readFile(TOKEN_PATH);
        });

        if (content) {
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        }
    } catch (err) {
        console.log('No valid token found in user data or local directory.');
    }
    return null;
}

async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

// Keep an active client instance so we don't have to re-auth on every request
let _driveClient = null;

async function authorize(event) {
    await initializePaths();
    let client;
    try {
        client = await loadSavedCredentialsIfExist();
    } catch (error) {
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ETIMEDOUT'))) {
             const err = new Error("Connection timed out while loading saved credentials. Please check your network connection.");
             err.code = 'ETIMEDOUT';
             throw err;
        }
        throw error;
    }

    if (client) {
        _driveClient = google.drive({ version: 'v3', auth: client });
        return _driveClient;
    }

    if (event) {
        try {
            client = await authenticate({
                scopes: SCOPES,
                keyfilePath: CREDENTIALS_PATH,
                auth: { redirect_uri_placeholder: 1 },
                client: { force_new_consent: true }
            });
        } catch (error) {
            if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ETIMEDOUT'))) {
                const err = new Error("Connection timed out while authenticating. Please check your network connection.");
                err.code = 'ETIMEDOUT';
                throw err;
            }
            throw error;
        }

        if (client.credentials) {
            await saveCredentials(client);
            _driveClient = google.drive({ version: 'v3', auth: client });
            return _driveClient;
        }
    }

    throw new Error("Not authorized");
}

async function getFolders(parentId = 'root', pageToken = null) {
    if (!_driveClient) await authorize(null);

    try {
        const response = await limiter.schedule(() => _driveClient.files.list({
            pageSize: 100, // Fetch in reasonable chunks
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'nextPageToken, files(id, name, parents)',
            orderBy: 'name',
            pageToken: pageToken
        }));

        return {
            folders: response.data.files || [],
            nextPageToken: response.data.nextPageToken || null
        };
    } catch (error) {
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ETIMEDOUT'))) {
            const err = new Error("Connection timed out while fetching folders. Please check your network connection.");
            err.code = 'ETIMEDOUT';
            throw err;
        }
        throw error;
    }
}

async function getFiles(parentId = 'root', pageToken = null) {
    if (!_driveClient) await authorize(null);

    try {
        const response = await limiter.schedule(() => _driveClient.files.list({
            pageSize: 300, // Fetch in reasonable chunks
            q: `'${parentId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'nextPageToken, files(id, name)',
            orderBy: 'name',
            pageToken: pageToken
        }));

        return {
            files: response.data.files || [],
            nextPageToken: response.data.nextPageToken || null
        };
    } catch (error) {
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ETIMEDOUT'))) {
            const err = new Error("Connection timed out while fetching files. Please check your network connection.");
            err.code = 'ETIMEDOUT';
            throw err;
        }
        throw error;
    }
}

async function renameFile(fileId, newTitle) {
    if (!_driveClient) await authorize(null);

    const body = { 'name': newTitle };
    try {
        const response = await limiter.schedule(() => _driveClient.files.update({
            fileId: fileId,
            resource: body
        }));

        return response.data;
    } catch (error) {
        if (error.code === 'ETIMEDOUT' || (error.message && error.message.includes('ETIMEDOUT'))) {
            const err = new Error(`Connection timed out while renaming file. Please check your network connection.`);
            err.code = 'ETIMEDOUT';
            throw err;
        }
        throw error;
    }
}

module.exports = {
    authorize,
    getFolders,
    getFiles,
    renameFile
};
