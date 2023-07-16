/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
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
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
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
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  console.log(client)
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const folderLists = await drive.files.list({
    pageSize: 30,
    q: "'root' in parents and mimeType='application/vnd.google-apps.folder'",
    spaces: 'drive',
    fields: 'nextPageToken, files(id, name)',
    orderBy: 'name'
  });
  const resFolderLists = folderLists.data.files;
  if (resFolderLists.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:')
  resFolderLists.map((file) => {
    //checkbox
    const checkboxFolders = document.createElement('INPUT')
    checkboxFolders.setAttribute('type', 'checkbox')
    checkboxFolders.value = file.id
    checkboxFolders.className = "cbox-folders peer hidden"
    //span
    const spanFolders = document.createElement('span')
    const textNode = document.createTextNode(file.name)
    spanFolders.appendChild(textNode)
    spanFolders.className =
    `inline-block w-full px-4 py-2 border-b border-gray-200 
    peer-checked:bg-gray-100
    hover:bg-gray-100 dark:border-gray-600`
    //li
    const listFolders = document.createElement('li')
    listFolders.setAttribute('id', file.id)
    listFolders.appendChild(checkboxFolders)
    listFolders.appendChild(spanFolders)
    listFolders.addEventListener("click", () => {
      console.log(checkboxFolders.value)
      let lenFolders = document.querySelectorAll(".cbox-folders").length
      for(let j = 0; j < lenFolders; j++) {
        document.querySelectorAll(".cbox-folders")[j].checked = false
      }
      checkboxFolders.checked = true
    })
    document.getElementById('folder-list').appendChild(listFolders)
  });

  const fileLists = await drive.files.list({
    pageSize: 30,
    q: "'root' in parents",
    spaces: 'drive',
    fields: 'nextPageToken, files(id, name)',
    orderBy: 'name'
  });
  const resFileLists = fileLists.data.files;
  if (resFileLists.length === 0) {
    console.log('No files found.');
    return;
  }
  resFileLists.map((file) => {
    //checkbox : cbFileFolder
    const cbFileFolder = document.createElement('INPUT')
    cbFileFolder.setAttribute('type', 'checkbox')
    cbFileFolder.value = file.id
    cbFileFolder.className = "cbox-files peer hidden"
    //span: spFileFolder
    const spFileFolder = document.createElement('span')
    const sptextNode = document.createTextNode(file.name)
    spFileFolder.appendChild(sptextNode)
    spFileFolder.className =
    `inline-block w-full px-4 py-2 border-b border-gray-200 
    peer-checked:bg-gray-100
    hover:bg-gray-100 dark:border-gray-600`
    //li: liFileFolder
    const liFileFolder = document.createElement('li')
    liFileFolder.setAttribute('id', file.id)
    liFileFolder.appendChild(cbFileFolder)
    liFileFolder.appendChild(spFileFolder)
    liFileFolder.addEventListener("click", () => {
      console.log(cbFileFolder.value)
      let lenFolders = document.querySelectorAll(".cbox-folders").length
      for(let j = 0; j < lenFolders; j++) {
        document.querySelectorAll(".cbox-folders")[j].checked = false
      }
      cbFileFolder.checked = true
    })
    document.getElementById('file-folder-list').appendChild(liFileFolder)
  });
}

document.getElementById("authorize").addEventListener('click', () => {
  authorize().then(listFiles).catch(console.error)
})