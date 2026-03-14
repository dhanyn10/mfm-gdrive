const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Bottleneck = require('bottleneck');
const { app } = require('electron');

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
    let client = await loadSavedCredentialsIfExist();

    if (client) {
        _driveClient = google.drive({ version: 'v3', auth: client });
        return _driveClient;
    }

    if (event) {
         client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
            auth: { redirect_uri_placeholder: 1 },
            client: { force_new_consent: true }
        });

        if (client.credentials) {
            await saveCredentials(client);
            _driveClient = google.drive({ version: 'v3', auth: client });
            return _driveClient;
        }
    }

    throw new Error("Not authorized");
}

async function getFolders() {
    if (!_driveClient) await authorize(null);
    let allFolders = [];
    let pageToken = null;

    do {
         const response = await limiter.schedule(() => _driveClient.files.list({
             pageSize: 1000,
             q: "mimeType='application/vnd.google-apps.folder'",
             spaces: 'drive',
             fields: 'nextPageToken, files(id, name)',
             orderBy: 'name',
             pageToken: pageToken
         }));
         allFolders = allFolders.concat(response.data.files || []);
         pageToken = response.data.nextPageToken;
    } while (pageToken);

    return allFolders;
}

async function getFiles(folderId) {
    if (!_driveClient) await authorize(null);
    let allFiles = [];
    let pageToken = null;

    do {
         const response = await limiter.schedule(() => _driveClient.files.list({
             pageSize: 1000,
             q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder'`,
             spaces: 'drive',
             fields: 'nextPageToken, files(id, name)',
             orderBy: 'name',
             pageToken: pageToken
         }));
         allFiles = allFiles.concat(response.data.files || []);
         pageToken = response.data.nextPageToken;
    } while (pageToken);

    return allFiles;
}

async function renameFile(fileId, newTitle) {
    if (!_driveClient) await authorize(null);

    const body = { 'name': newTitle };
    const response = await limiter.schedule(() => _driveClient.files.update({
        fileId: fileId,
        resource: body
    }));

    return response.data;
}

module.exports = {
    authorize,
    getFolders,
    getFiles,
    renameFile
};
