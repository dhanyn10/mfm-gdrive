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
const Swal = require('sweetalert2')
const bottleneck = require('bottleneck')
const limiter = new bottleneck({minTime: 110})
let gdrive = null

import { elemFactory } from './utils.js'

// variable
const mime = "application/vnd.google-apps.folder"
var parentFolder = ['root']
let listAllFiles = []

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

function renameFile(fileId, newTitle) {
  var body = {'name': newTitle}
  limiter.schedule(() => {
    gdrive.files.update({
      'fileId': fileId,
      'resource': body
    }, (err, res) => {
      if(err)
          console.error(`error: ${err}`)
      else
      console.log(`renamed: ${res.data.name}`)
    })
  })
}

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
async function listFiles(authenticate, source) {
  gdrive = google.drive({version: 'v3', auth: authenticate});
    //checkbox
    let upcbFolders = elemFactory('input', 'type', 'checkbox', "cbox-folders peer hidden", source, null, null)
    //span
    let upSpFolders = elemFactory('span', null, null,
    `inline-block w-full px-4 py-2 border-b border-gray-200 peer-checked:bg-gray-100
    hover:bg-gray-100 dark:border-gray-600`, null, "...", upcbFolders)
    //li
    let upListFolders = elemFactory('li', null, null, null, null, null, [upcbFolders, upSpFolders])
    upListFolders.addEventListener("click", () => {
      // console.log(checkboxFolders.value)
      if(parentFolder.length > 1) {
        parentFolder.pop()
      }
      listFiles(authenticate, parentFolder[parentFolder.length-1])
      let lenFolders = document.querySelectorAll(".cbox-folders").length
      for(let j = 0; j < lenFolders; j++) {
        document.querySelectorAll(".cbox-folders")[j].checked = false
      }
      upcbFolders.checked = true
    })
    document.getElementById('folder-list').innerHTML = ""
    document.getElementById('folder-list').appendChild(upListFolders)
    let folderLists = await gdrive.files.list({
      pageSize: 30,
      q: `'${parentFolder[parentFolder.length-1]}' in parents`,
      spaces: 'drive',
      fields: 'nextPageToken, files(id, name, mimeType)',
      orderBy: 'name'
    });
    let resFolderLists = folderLists.data.files
    if (resFolderLists.length === 0) {
      console.log('No files found.');
      return;
    }

  resFolderLists.map((file) => {
    //checkbox
    let checkboxFolders = elemFactory('input', 'type', 'checkbox', "cbox-folders peer hidden", file.id, null, null)
    //span
    let spanFolders = elemFactory('span', null, null, 
    `inline-block w-full px-4 py-2 border-b border-gray-200 peer-checked:bg-gray-100 cursor-pointer
    hover:bg-gray-100 dark:border-gray-600`
    , null, file.name, null)
    
    //li
    // const listFolders = document.createElement('li')
    let listFolders = elemFactory('li', null, null, null, null, null, [checkboxFolders, spanFolders])
    listFolders.addEventListener("click", () => {
      parentFolder.push(checkboxFolders.value)
      listFiles(authenticate, checkboxFolders.value)
      let lenFolders = document.querySelectorAll(".cbox-folders").length
      for(let j = 0; j < lenFolders; j++) {
        document.querySelectorAll(".cbox-folders")[j].checked = false
      }
      checkboxFolders.checked = true
    })
    if(file.mimeType == "application/vnd.google-apps.folder")
      document.getElementById('folder-list').appendChild(listFolders)
  });

  let fileLists = await gdrive.files.list({
    pageSize: 30,
    q: `'${parentFolder[parentFolder.length-1]}' in parents`,
    spaces: 'drive',
    fields: 'nextPageToken, files(id, name, mimeType)',
    orderBy: 'folder, name'
  });
  // console.log(parentFolder, parentFolder[parentFolder.length-2])
  let resFileLists = fileLists.data.files;
  if (resFileLists.length === 0) {
    console.log('No files found.');
    return;
  }
  document.getElementById('file-folder-list').innerHTML = null
  listAllFiles = []
  resFileLists.map((file) => {
    //checkbox : cbFileFolder
    let cbFileFolder = elemFactory(
      'input', 'type', 'checkbox', "cbox-file-folder peer hidden", file.id, null, null)
    //span: spFileFolder
    let spFileFolder = elemFactory('span', null, null,
    `flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto
    peer-checked:bg-gray-100 cursor-pointer
    hover:bg-gray-100 dark:border-gray-600`, null, null, null)
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
    const sptextNode = document.createTextNode(file.name)
    spFileFolder.appendChild(sptextNode)
    //li: liFileFolder
    let liFileFolder = elemFactory('li', null, null, null, null, null, [cbFileFolder, spFileFolder])
    
    listAllFiles.push({
      id: file.id,
      name: file.name,
      checked: cbFileFolder.checked
    })
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
  document.getElementById("mfm-opt").classList.remove("invisible")
  document.getElementById("folders").classList.remove("invisible")
  document.getElementById("files").classList.remove("invisible")
  document.getElementById("mfm-play").classList.remove("invisible")
  authorize().then(listFiles).catch(console.error)
})

// define value for swal
const inputClass =
`block w-full p-2 text-gray-900 border border-gray-300 rounded-lg 
bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 
dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500
mb-2
`
const myswal = Swal.mixin({
  customClass: {
    title: `block mb-2 text-sm font-medium text-gray-900 dark:text-white`,
    confirmButton: `px-3 py-2 text-xs font-medium text-center text-white bg-blue-700 
    rounded-sm hover:bg-blue-800 focus:ring-4 focus:outline-none 
    focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 
    dark:focus:ring-blue-800`
  },
  buttonsStyling: false
})

document.getElementById('mfm-play').addEventListener('click', () => {
  let child = document.getElementById('mfm-opt').children[0]
  if(child.value == 1) {
    myswal.fire({
      title: child[1].innerHTML,
      html:
      '<input id="from" placeholder="from" class="'+inputClass+'">' +
      '<input id="to" placeholder="to" class="'+inputClass+'">',
      confirmButtonText: "RUN",
      inputAttributes: {
        maxlength: 10,
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    }).then((res) => {
      if(res.isConfirmed) {
        let from = document.getElementById('from').value
        let to = document.getElementById('to').value

        let chData = document.getElementsByClassName('cbox-file-folder')
        for(let j = 0; j < listAllFiles.length; j++) {
          // transform to checked
          if(chData[j].checked) {  
            let newfilename = listAllFiles[j].name.replace(from, to)
            renameFile(listAllFiles[j].id, newfilename)
          }
        }
      }
    })
  }
  else if(child.value == 2) {
    myswal.fire({
      title: child[2].innerHTML,
      html:
      '<input type="number" id="start" placeholder="start(index)" class="'+inputClass+'">' +
      '<input type="number" id="end" placeholder="end(index)" class="'+inputClass+'">',
      inputAttributes: {
        maxlength: 10,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      preConfirm: () => {
        return [
          document.getElementById('start').value,
          document.getElementById('end').value
        ]
      }
    })
  }
})