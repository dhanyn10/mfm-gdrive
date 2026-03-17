import { promises as fs } from 'fs';
import * as path from 'path';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import Bottleneck from 'bottleneck';
import { app } from 'electron';

// Set global timeout for Google APIs to 30 seconds
google.options({ timeout: 10000 });

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];

let TOKEN_PATH: string;
let LOCAL_TOKEN_PATH: string;
let CREDENTIALS_PATH: string;

const limiter = new Bottleneck({ minTime: 110 });

async function initializePaths() {
    if (TOKEN_PATH) return;
    const userDataPath = app.getPath('userData');
    const localTokenBasePath = app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath();
    TOKEN_PATH = path.join(userDataPath, 'token.json');
    CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
    LOCAL_TOKEN_PATH = path.join(localTokenBasePath, 'token.json');
}

async function loadSavedCredentialsIfExist(): Promise<any> {
    try {
        const content = await fs.readFile(LOCAL_TOKEN_PATH, 'utf-8').catch(() => {
            return fs.readFile(TOKEN_PATH, 'utf-8');
        });

        if (content) {
            const credentials = JSON.parse(content as string);
            return google.auth.fromJSON(credentials);
        }
    } catch (err) {
        console.log('No valid token found in user data or local directory.');
    }
    return null;
}

async function saveCredentials(client: any) {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content as string);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

// Helper to detect network errors
function isNetworkError(error: any) {
    if (!error) return false;
    const msg = error.message || '';
    const code = error.code || '';
    return msg.includes('ETIMEDOUT') || code === 'ETIMEDOUT' ||
           msg.includes('ENOTFOUND') || code === 'ENOTFOUND' ||
           msg.includes('ECONNREFUSED') || code === 'ECONNREFUSED' ||
           msg.includes('ECONNRESET') || code === 'ECONNRESET';
}

function throwNetworkError(contextMsg: string) {
    const err: any = new Error(`${contextMsg} Please check your internet connection.`);
    err.code = 'NETWORK_ERROR';
    throw err;
}

// Keep an active client instance so we don't have to re-auth on every request
let _driveClient: any = null;

async function authorize(event: any) {
    await initializePaths();
    let client;
    try {
        client = await loadSavedCredentialsIfExist();
    } catch (error) {
        if (isNetworkError(error)) {
             throwNetworkError("Connection failed while loading saved credentials.");
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
            } as any);
        } catch (error: any) {
            if (isNetworkError(error)) {
                throwNetworkError("Connection failed while authenticating.");
            }
            throw error;
        }

        if (client.credentials) {
            await saveCredentials(client);
            _driveClient = google.drive({ version: 'v3', auth: client as any });
            return _driveClient;
        }
    }

    throw new Error("Not authorized");
}

async function getFolders(parentId: string = 'root', pageToken: string | null = null, customTimeout: number | null = null) {
    if (!_driveClient) await authorize(null);

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
            folders: (response as any).data.files || [],
            nextPageToken: (response as any).data.nextPageToken || null
        };
    } catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while fetching folders.");
        }
        throw error;
    }
}

async function getFiles(parentId: string = 'root', pageToken: string | null = null, customTimeout: number | null = null) {
    if (!_driveClient) await authorize(null);

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
            files: (response as any).data.files || [],
            nextPageToken: (response as any).data.nextPageToken || null
        };
    } catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while fetching files.");
        }
        throw error;
    }
}

async function renameFile(fileId: string, newTitle: string) {
    if (!_driveClient) await authorize(null);

    const body = { 'name': newTitle };
    try {
        const response = await limiter.schedule(() => _driveClient.files.update({
            fileId: fileId,
            resource: body
        }));

        return (response as any).data;
    } catch (error) {
        if (isNetworkError(error)) {
            throwNetworkError("Connection failed while renaming file.");
        }
        throw error;
    }
}

export {
    authorize,
    getFolders,
    getFiles,
    renameFile
};
