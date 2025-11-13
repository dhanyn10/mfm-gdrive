// driveApi.js
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Bottleneck = require('bottleneck');
const { ipcRenderer } = require('electron');

// Import showToast from utils
// Ensure this path is correct relative to your driveApi.js file's location
const { showToast } = require('./utils');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];

// These paths will be initialized asynchronously
let TOKEN_PATH;
let CREDENTIALS_PATH;

// Limiter to control the rate of requests to the Google Drive API
const limiter = new Bottleneck({ minTime: 110 });

async function initializePaths() {
    const userDataPath = await ipcRenderer.invoke('get-user-data-path');
    TOKEN_PATH = path.join(userDataPath, 'token.json');
    CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
}

/**
 * Reads previously authorized credentials from the save file.
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
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

/**
 * Loads or requests authorization to call APIs.
 * @returns {Promise<OAuth2Client>} The authorized OAuth2 client.
 */
async function authorizeAndGetDrive() {
    if (!CREDENTIALS_PATH) await initializePaths();
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return google.drive({ version: 'v3', auth: client });
    }
    // If no saved credentials, trigger interactive auth and poll for the token.
    // This function will now primarily be for getting an existing client.
    // The interactive part is handled by triggerUserAuthorization.
    return null;
}

/**
 * Triggers the user authorization flow which opens a browser window.
 * It does not wait for the flow to complete.
 */
function triggerUserAuthorization() {
    // This runs in the background. When the user completes the flow,
    // @google-cloud/local-auth will save the token to TOKEN_PATH.
    authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
        auth: {
            redirect_uri_placeholder: 1,
        },
        client: {
            force_new_consent: true,
        }
    }).then(async (client) => {
        if (client.credentials) {
            await saveCredentials(client);
            console.log('Credentials saved successfully by background process.');
        }
    }).catch(err => {
        console.error('Background authorization process failed:', err);
    });
}

/**
 * Renames a file in Google Drive.
 * @param {string} fileId - The ID of the file to rename.
 * @param {string} newTitle - The new name for the file.
 * @param {string} oldTitle - The original name of the file, for the toast message.
 * @returns {Promise<object>} - A promise that resolves with the updated file data or rejects with an error.
 */
function renameFile(gdrive, fileId, newTitle, oldTitle) {
    return new Promise((resolve, reject) => {
        const body = { 'name': newTitle };
        limiter.schedule(() => {
            gdrive.files.update({
                'fileId': fileId,
                'resource': body
            }, (err, res) => {
                if (err) {
                    showToast(`Error renaming file: ${err.message}`, 'error');
                    console.error(`Error: ${err}`);
                    reject(err);
                } else {
                    showToast(`Renamed '${oldTitle}' to '${res.data.name}'`, 'success');
                    resolve(res.data);
                }
            });
        });
    });
}

/**
 * Helper function to fetch file lists from Google Drive.
 * @param {string} parentId - The ID of the parent folder.
 * @param {string} orderBy - How to order the results.
 * @param {string} pageToken - The page token for pagination.
 * @returns {Promise<object>} - An object containing files and nextPageToken.
 */
async function fetchDriveFiles(gdrive, parentId, orderBy, pageToken = null) {
    const response = await limiter.schedule(() => gdrive.files.list({
        pageSize: 30, // Number of items per page
        q: `'${parentId}' in parents`,
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name, mimeType)',
        orderBy: orderBy,
        pageToken: pageToken
    }));
    return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken || null
    };
}

module.exports = {
    initializePaths,
    authorizeAndGetDrive,
    triggerUserAuthorization,
    renameFile,
    fetchDriveFiles
};
