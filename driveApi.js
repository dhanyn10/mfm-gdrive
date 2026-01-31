// driveApi.js
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Bottleneck = require('bottleneck');
const { ipcRenderer } = require('electron');
const { addNotification } = require('./ui');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];

// These paths will be initialized asynchronously.
let TOKEN_PATH;
let LOCAL_TOKEN_PATH;
let CREDENTIALS_PATH;

// Limiter to control the rate of requests to the Google Drive API.
const limiter = new Bottleneck({ minTime: 110 });

/**
 * Initializes the paths for token and credentials files.
 * This function is called asynchronously to get paths from the main process.
 * @returns {Promise<void>}
 */
async function initializePaths() {
    if (TOKEN_PATH) return; // Already initialized.
    const localTokenBasePath = await ipcRenderer.invoke('get-local-token-base-path');
    const userDataPath = await ipcRenderer.invoke('get-user-data-path');
    TOKEN_PATH = path.join(userDataPath, 'token.json');
    CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
    LOCAL_TOKEN_PATH = path.join(localTokenBasePath, 'token.json');
}

/**
 * Reads previously authorized credentials from the save file.
 * It first checks the local application directory, then the user data path.
 * @returns {Promise<import('google-auth-library').OAuth2Client|null>} A Google OAuth2 client or null if no token exists.
 */
async function loadSavedCredentialsIfExist() {
    try {
        // Try reading from the local app directory first.
        const content = await fs.readFile(LOCAL_TOKEN_PATH).catch(() => {
            // If it fails, try reading from the user data path.
            return fs.readFile(TOKEN_PATH);
        });

        if (content) {
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        }
    } catch (err) {
        // If both fail, return null.
        console.log('No valid token found in user data or local directory.');
    }
    return null;
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 * This saves the refresh token, allowing for repeated authorization.
 * @param {import('google-auth-library').OAuth2Client} client The authorized client.
 * @returns {Promise<void>}
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
 * Loads existing credentials and returns an authorized Google Drive client.
 * If no credentials exist, it returns null, and the UI should trigger authorization.
 * @returns {Promise<import('googleapis').drive_v3.Drive|null>} The authorized Google Drive API client or null.
 */
async function authorizeAndGetDrive() {
    if (!CREDENTIALS_PATH) await initializePaths();
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return google.drive({ version: 'v3', auth: client });
    }
    // If no saved credentials, the interactive part is handled by triggerUserAuthorization.
    return null;
}

/**
 * Triggers the user authorization flow which opens a browser window.
 * This function runs in the background and does not wait for completion.
 * Upon success, it saves the credentials.
 * @returns {void}
 */
function triggerUserAuthorization() {
    // This runs in the background. When the user completes the flow,
    // @google-cloud/local-auth will save the token.
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
 * @param {import('googleapis').drive_v3.Drive} gdrive The authorized Google Drive API client.
 * @param {string} fileId The ID of the file to rename.
 * @param {string} newTitle The new name for the file.
 * @param {string} oldTitle The original name of the file, for the toast message.
 * @returns {Promise<object>} A promise that resolves with the updated file data or rejects with an error.
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
                    addNotification(`Error renaming file: ${err.message}`, 'error', fileId);
                    console.error(`Error: ${err}`);
                    reject(err);
                } else {
                    addNotification(`Renamed '${oldTitle}' to '${res.data.name}'`, 'success', fileId);
                    resolve(res.data);
                }
            });
        });
    });
}

/**
 * Helper function to fetch file and folder lists from Google Drive with rate limiting.
 * @param {import('googleapis').drive_v3.Drive} gdrive The authorized Google Drive API client.
 * @param {string} parentId The ID of the parent folder (use 'root' for the root folder).
 * @param {string} orderBy A comma-separated list of sort keys.
 * @param {string|null} [pageToken=null] The page token for pagination.
 * @returns {Promise<{files: Array<object>, nextPageToken: string|null}>} An object containing files and the next page token.
 */
async function fetchDriveFiles(gdrive, parentId, orderBy, pageToken = null) {
    const response = await limiter.schedule(() => gdrive.files.list({
        pageSize: 30, // Number of items per page.
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
