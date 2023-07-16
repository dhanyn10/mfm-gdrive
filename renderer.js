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
let parentFolder = ['root']
const mime = "application/vnd.google-apps.folder";

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
async function listFiles(authClient, source) {
  const drive = google.drive({version: 'v3', auth: authClient});
    //checkbox
    let upcbFolders = document.createElement('INPUT')
    upcbFolders.setAttribute('type', 'checkbox')
    upcbFolders.value = source
    upcbFolders.className = "cbox-folders peer hidden"
    //span
    const upSpFolders = document.createElement('span')
    const upTextNode = document.createTextNode("...")
    upSpFolders.appendChild(upTextNode)
    upSpFolders.className =
    `inline-block w-full px-4 py-2 border-b border-gray-200 
    peer-checked:bg-gray-100
    hover:bg-gray-100 dark:border-gray-600`
    //li
    const upListFolders = document.createElement('li')
    upListFolders.appendChild(upcbFolders)
    upListFolders.appendChild(upSpFolders)
    upListFolders.addEventListener("click", () => {
      // console.log(checkboxFolders.value)
      if(parentFolder.length > 1) {
        parentFolder.pop()
      }
      listFiles(authClient, parentFolder[parentFolder.length-1])
      let lenFolders = document.querySelectorAll(".cbox-folders").length
      for(let j = 0; j < lenFolders; j++) {
        document.querySelectorAll(".cbox-folders")[j].checked = false
      }
      upcbFolders.checked = true
    })
    document.getElementById('folder-list').innerHTML = ""
    document.getElementById('folder-list').appendChild(upListFolders)
    let folderLists = await drive.files.list({
      pageSize: 30,
      q: `'${parentFolder[parentFolder.length-1]}' in parents and mimeType='application/vnd.google-apps.folder'`,
      spaces: 'drive',
      fields: 'nextPageToken, files(id, name)',
      orderBy: 'name'
    });
    let resFolderLists = folderLists.data.files;
    if (resFolderLists.length === 0) {
      console.log('No files found.');
      return;
    }
  
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
    peer-checked:bg-gray-100 cursor-pointer
    hover:bg-gray-100 dark:border-gray-600`
    //li
    const listFolders = document.createElement('li')
    listFolders.appendChild(checkboxFolders)
    listFolders.appendChild(spanFolders)
    listFolders.addEventListener("click", () => {
      parentFolder.push(checkboxFolders.value)
      listFiles(authClient, checkboxFolders.value)
      let lenFolders = document.querySelectorAll(".cbox-folders").length
      for(let j = 0; j < lenFolders; j++) {
        document.querySelectorAll(".cbox-folders")[j].checked = false
      }
      checkboxFolders.checked = true
    })
    document.getElementById('folder-list').appendChild(listFolders)
  });

  let fileLists = await drive.files.list({
    pageSize: 30,
    q: `'${parentFolder[parentFolder.length-1]}' in parents`,
    spaces: 'drive',
    fields: 'nextPageToken, files(id, name, mimeType)',
    orderBy: 'folder, name'
  });
  let resFileLists = fileLists.data.files;
  if (resFileLists.length === 0) {
    console.log('No files found.');
    return;
  }
  document.getElementById('file-folder-list').innerHTML = null
  resFileLists.map((file) => {
    //checkbox : cbFileFolder
    const cbFileFolder = document.createElement('INPUT')
    cbFileFolder.setAttribute('type', 'checkbox')
    cbFileFolder.value = file.id
    cbFileFolder.className = "cbox-file-folder peer hidden"

    //span: spFileFolder
    const spFileFolder = document.createElement('span')
    const sptextNode = document.createTextNode(file.name)
    if(file.mimeType == "application/vnd.google-apps.folder") {
          //span : folder icon
      const spFolderIcon = document.createElement('span')
      spFolderIcon.className = "float-left pr-2"
      spFolderIcon.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
        <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
      </svg>  
        `
      spFileFolder.appendChild(spFolderIcon) //span folder icon
    }
    spFileFolder.appendChild(sptextNode)
    spFileFolder.className =
    `flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto
    peer-checked:bg-gray-100 cursor-pointer
    hover:bg-gray-100 dark:border-gray-600`
    //li: liFileFolder
    const liFileFolder = document.createElement('li')
    liFileFolder.appendChild(cbFileFolder) // checkbox
    liFileFolder.appendChild(spFileFolder) // span
    liFileFolder.addEventListener("click", () => {
      // console.log(file.mimeType)
      if(file.mimeType != mime) { // only allows selection for non-folder
        if(cbFileFolder.checked == false) 
          cbFileFolder.checked = true
        else
          cbFileFolder.checked = false
      }
    })
    document.getElementById('file-folder-list').appendChild(liFileFolder)
  });
}

document.getElementById("authorize").addEventListener('click', () => {
  authorize().then(listFiles).catch(console.error)
})