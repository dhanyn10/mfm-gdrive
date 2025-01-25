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
var arrParentFolder = ['root']
let arrListFolders = []
let arrListAllFiles = []

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
  
  // upfolder elements
  //checkbox
  let upcbFolders = elemFactory('input', {
    type: 'checkbox',
    "class": 'cbox-folders peer hidden',
    value: source
  });
  //span
  let upSpFolders = elemFactory('span', {
    "class": 'inline-block w-full px-4 py-2 border-b border-gray-200 hover:bg-gray-100 dark:border-gray-600',
    innerHTML: "...",
    child: upcbFolders
  });
  //li
  let upListFolders = elemFactory('li', { child: [upcbFolders, upSpFolders]})
  upListFolders.addEventListener("click", () => {
    // console.log(checkboxFolders.value)
    if(arrParentFolder.length > 1) {
      arrParentFolder.pop()
    }
    listFiles(authenticate, arrParentFolder[arrParentFolder.length-1])
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
    q: `'${arrParentFolder[arrParentFolder.length-1]}' in parents`,
    spaces: 'drive',
    fields: 'nextPageToken, files(id, name, mimeType)',
    orderBy: 'name'
  });
  let resFolderLists = folderLists.data.files
  if (resFolderLists.length === 0) {
    console.log('No more folder found');
    return;
  }

  arrListFolders = []
  resFolderLists.map((file) => {
    // insert folder data into arListFolders
    if(file.mimeType == "application/vnd.google-apps.folder") {
      arrListFolders.push({
        id: file.id,
        name: file.name
      })
    }
  })
  
  // loop arrListFolder
  for(let i = 0; i < arrListFolders.length; i++) {
    //checkbox
      let checkboxFolders = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-folders peer hidden",
        value: arrListFolders[i].id
      });
    //span
    let spanFolders = elemFactory('span', {
      "class": "inline-block w-full px-4 py-2 border-b border-gray-200 peer-checked:bg-gray-100 hover:bg-gray-100",
      innerHTML: arrListFolders[i].name
    });
    let listFolders = elemFactory('li', {child: [checkboxFolders, spanFolders]})
    listFolders.addEventListener("click", () => {
      listFiles(authenticate, arrParentFolder[arrParentFolder.length-1])
      arrParentFolder.push(arrListFolders[i].id)
    })
    document.getElementById('folder-list').appendChild(listFolders)
  }

  let fileLists = await gdrive.files.list({
    pageSize: 30,
    q: `'${arrParentFolder[arrParentFolder.length-1]}' in parents`,
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

  arrListAllFiles = []
  resFileLists.map((file) => {
    arrListAllFiles.push({
      id: file.id,
      name: file.name,
      type: file.mimeType,
      checked: false
    })
  })

  //loop for list file and folder
  for(let i = 0; i < arrListAllFiles.length; i++) {
      //checkbox : cbFileFolder
      let cbFileFolder = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-file-folder peer hidden",
        value: arrListAllFiles[i].id
      });
      cbFileFolder.checked = arrListAllFiles[i].checked
    //span: spFileFolder
    let spFileFolder = elemFactory('span', {
      "class": "flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto select-none \
                  peer-checked:bg-blue-500 peer-checked:text-white cursor-not-allowed \
                  hover:bg-gray-100 hover:overflow-visible",
    });

    
    let fullFileName = document.createElement('span')
    if(arrListAllFiles[i].type == "application/vnd.google-apps.folder") {
          //span : folder icon
      const spFolderIcon = document.createElement('span')
      spFolderIcon.className = "float-left pr-2"
      spFolderIcon.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
        <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
      </svg>  
        `
      spFileFolder.appendChild(spFolderIcon) //span folder icon
    } else {
      //setup cursor for non folder
      spFileFolder.classList.remove('cursor-not-allowed')
      spFileFolder.classList.add('cursor-pointer')
      for (let j = 0; j < arrListAllFiles[i].name.length; j++) {
        // Initialize a container for the tooltips
        let fullCharTooltip = elemFactory('span', {"class": "relative group"})
        let spanChar = elemFactory('span', {"class": "hover:ring ring-blue-200"})
        let charNumTooltip = elemFactory("span", {"class":
          "absolute left-1/2 transform -translate-x-1/2 top-[-25px] w-max \
          px-2 py-1 text-sm text-white bg-black rounded opacity-0 group-hover:opacity-100 \
          transition-opacity duration-300"})

          spanChar.innerHTML = arrListAllFiles[i].name.charAt(j) === " " ? "&nbsp;" : arrListAllFiles[i].name.charAt(j)
          spanChar.classList.add('font-mono', 'whitespace-hormal')
          charNumTooltip.innerHTML = j+1

          fullCharTooltip.appendChild(spanChar)
          fullCharTooltip.appendChild(charNumTooltip)
          fullFileName.appendChild(fullCharTooltip)
      }
    }

    // Create a text node with the file name and append it to spFileFolder
    if(arrListAllFiles[i].type == mime) {
      let sptextNode = document.createTextNode(arrListAllFiles[i].name)
      spFileFolder.appendChild(sptextNode)
    } else {
      spFileFolder.appendChild(fullFileName)
    }
    //li: liFileFolder
    let liFileFolder = elemFactory('li', {
      child: [cbFileFolder, spFileFolder]
    })

    liFileFolder.addEventListener("click", () => {
      if(arrListAllFiles[i].type != mime) { // only allows selection for non-folder
        if(arrListAllFiles[i].checked == false)
            arrListAllFiles[i].checked = true
        else
          arrListAllFiles[i].checked = false
      }
      document.getElementsByClassName('cbox-file-folder')[i].checked = arrListAllFiles[i].checked
    })
    
    document.getElementById('file-folder-list').appendChild(liFileFolder)
  }
  let firstchildFileList = elemFactory('div', {"class": "h-4 bg-gray-100"})
  // remove additional div at first list for folder list
  document.getElementById('file-folder-list').prepend(firstchildFileList)
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
mb-2
`
const myswal = Swal.mixin({
  customClass: {
    title: `block mb-2 text-sm font-medium text-gray-900 dark:text-white`,
    confirmButton: `px-3 py-2 text-xs font-medium text-center text-white bg-blue-700 
    rounded-sm hover:bg-blue-800 focus:ring-4 focus:outline-none 
    focus:ring-blue-300`
  },
  buttonsStyling: false
})

document.getElementById('mfm-play').addEventListener('click', () => {
  let child = document.getElementById('mfm-opt').children[0]
  // option variable is used to capture and store the user's selection or choice
  const option = child.value
  if(option == 1) {
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
        for(let j = 0; j < arrListAllFiles.length; j++) {
          
          if(chData[j].checked) {  
            let newfilename = arrListAllFiles[j].name.replace(from, to)
            renameFile(arrListAllFiles[j].id, newfilename)
          }
        }
      }
    })
  }
  else if(option == 2) {
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
  else if(option == 3) {
    myswal.fire({
      title: child[3].innerHTML,
      html:
      '<input id="numprefix" placeholder="expected value" class="'+inputClass+'">',
      confirmButtonText: "RUN",
      inputAttributes: {
        maxlength: 10,
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    }).then((res) => {
      if(res.isConfirmed) {
        /**
         * 'numprefix' is a variable that stores a string containing both a non-numeric prefix
         * and a numeric part. The goal is to pad the numeric part of the string with leading zeros
         * to ensure it reaches a specific length, while keeping the non-numeric prefix unchanged.
         * 
         * For example, given the input 'abc123', we want to add leading zeros to the numeric part 
         * ('123') so that it becomes '00123', resulting in the final string 'abc00123'.
         */
        const numPrefix = document.getElementById('numprefix').value
        
        let chData = document.getElementsByClassName('cbox-file-folder')
        for(let j = 0; j < arrListAllFiles.length; j++) {
          
          if(chData[j].checked) {

            const filename = arrListAllFiles[j].name
            const paddedFilename = padFilename(filename, numPrefix);

            let newfilename = arrListAllFiles[j].name.replace(filename, paddedFilename)
            renameFile(arrListAllFiles[j].id, newfilename)
          }
        }
      }
    })
  }
})

/**
 *  feature: select multiple with shiftkey + click, like gmail
 * @var fromIndex : first index of the selected file
 * @var toIndex : last index of the selected file
 */
let fromIndex = null
let toIndex = null
document.getElementById('file-folder-list').addEventListener('click', (evt) => {
  let checkboxes = arrListAllFiles
  for(let k = 0; k < checkboxes.length; k++)
  {
    if(checkboxes[k].checked && evt.shiftKey == false) {
      fromIndex = k
    }
    if(checkboxes[k].checked && evt.shiftKey == true) {
      toIndex = k
      
      let low = fromIndex
      let high = toIndex
      if(low > high) {
          low = toIndex
          high = fromIndex
      }
      for(let idx = low; idx <= high; idx++) {
        document.getElementsByClassName('cbox-file-folder')[idx].checked = true
        arrListAllFiles[idx].checked = true
      }
    }
  }
})

/**
 * Pads numbers in a single filename based on the specified length.
 * @param {string} filename - The filename to process.
 * @param {number} padLength - Number of digits to pad the numbers to.
 * @returns {string} - The filename with the padded number.
 */
function padFilename(filename, padLength) {
  // Use regex to find any number in the filename
  return filename.replace(/(\D*?)(\d+)(.*)/, (_, prefix, num, suffix) => {
    // Pad the numeric part
    const paddedNum = num.padStart(padLength, "0");
    // Return the updated filename
    return `${prefix}${paddedNum}${suffix}`;
  });
}
