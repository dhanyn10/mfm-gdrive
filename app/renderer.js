const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const Bottleneck = require('bottleneck'); // Assuming Bottleneck is installed

// SweetAlert2 and Toastify-JS
const Swal = require('sweetalert2');
const Toastify = require('toastify-js');

// --- Helper Functions ---
function elemFactory(tag, options = {}) {
    const elem = document.createElement(tag);
    for (const key in options) {
        if (key === 'child') {
            if (Array.isArray(options[key])) {
                options[key].forEach(childElem => {
                    if (childElem instanceof HTMLElement) {
                        elem.appendChild(childElem);
                    }
                });
            } else if (options[key] instanceof HTMLElement) {
                elem.appendChild(options[key]);
            }
        } else if (key === 'innerHTML') {
            elem.innerHTML = options[key];
        } else {
            elem.setAttribute(key, options[key]);
        }
    }
    return elem;
}

function createFileNameWithTooltips(filename) {
    const tooltipSpan = elemFactory('span', {
        'class': 'tooltip-container relative',
        'innerHTML': filename
    });
    tooltipSpan.setAttribute('title', filename); // Add native title for basic tooltip
    return tooltipSpan;
}

function padFilename(filename, numPrefix) {
    const num = parseInt(numPrefix, 10);
    if (isNaN(num) || num <= 0) {
        return filename;
    }

    const parts = filename.split('.');
    const extension = parts.length > 1 ? '.' + parts.pop() : '';
    const baseName = parts.join('.');

    // Find if there's a number at the beginning of the filename
    const match = baseName.match(/^(\d+)(.*)$/);
    if (match) {
        const currentNumber = match[1];
        const restOfName = match[2];
        const paddedNumber = currentNumber.padStart(num, '0');
        return paddedNumber + restOfName + extension;
    }

    return filename; // No number to pad, return original filename
}

// --- Notifications Functions ---
function showToast(text, type = 'info') {
    const classMap = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-slate-700'
    };

    Toastify({
        text: text,
        duration: 5000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        className: `text-white px-4 py-2 rounded-md shadow-lg ${classMap[type] || classMap['info']}`,
    }).showToast();
}

const inputClass =
    `block w-full p-2 text-gray-900 border border-gray-300 rounded-lg
bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500
mb-2
`;

const myswal = Swal.mixin({
    customClass: {
        title: `block mb-2 text-sm font-medium text-gray-900 dark:text-white`,
        confirmButton: `px-3 py-2 text-xs font-medium text-center text-white bg-blue-700
        rounded-sm hover:bg-blue-800 focus:ring-4 focus:outline-none
        focus:ring-blue-300`
    },
    buttonsStyling: false
});

// --- Main Global Variables ---
const mime = "application/vnd.google-apps.folder";
var arrParentFolder = ['root'];
let arrListFolders = [];
let arrListAllFiles = [];
let gdrive = null; // This will be initialized after authorization

// Variables for pagination
let currentPageToken = null; // Token for the current page (null for the first page)
let nextPageTokenFromAPI = null; // Token returned by the API for the *next* page
let prevPageTokensStack = []; // Stack to keep track of page tokens to go back

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Limiter
const limiter = new Bottleneck({ minTime: 110 });


// Get references to DOM elements
const authorizeButton = document.getElementById('authorize');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

// Flag to track if initial authorization was successful
let isInitialAuthSuccessful = false;

/**
 * Renames a file in Google Drive.
 * @param {string} fileId - The ID of the file to rename.
 * @param {string} newTitle - The new name for the file.
 * @param {string} oldTitle - The original name of the file, for the toast message.
 * @returns {Promise<object>} - A promise that resolves with the updated file data or rejects with an error.
 */
function renameFile(fileId, newTitle, oldTitle) {
    return new Promise((resolve, reject) => {
        const body = { 'name': newTitle };
        limiter.schedule(() => {
            gdrive.files.update({
                'fileId': fileId,
                'resource': body
            }, (err, res) => {
                if (err) {
                    showToast(`Error renaming file: ${err.message}`, 'error');
                    console.error(`Error: ${err}`); // Keep console log for debugging
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
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
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
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Helper function to fetch file lists from Google Drive.
 * @param {string} parentId - The ID of the parent folder.
 * @param {string} orderBy - How to order the results.
 * @param {string} pageToken - The page token for pagination.
 * @returns {Promise<object>} - An object containing files and nextPageToken.
 */
async function fetchDriveFiles(parentId, orderBy, pageToken = null) {
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

/**
 * Handles the click event for folder list items.
 * @param {object} folder - The folder object.
 * @param {OAuth2Client} authClient - An authorized OAuth2 client.
 */
function handleFolderClick(folder, authClient) {
    arrParentFolder.push(folder.id);
    // Reset pagination state when changing folders
    currentPageToken = null;
    nextPageTokenFromAPI = null;
    prevPageTokensStack = [];
    listFiles(authClient, folder.id);
}

/**
 * Creates a folder list item element.
 * @param {object} folder - The folder object.
 * @param {OAuth2Client} authClient - An authorized OAuth2 client.
 * @returns {HTMLElement} - The list item element.
 */
function createFolderListItem(folder, authClient) {
    let checkbox = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-folders peer hidden",
        value: folder.id
    });
    let span = elemFactory('span', {
        "class": "inline-block w-full px-4 py-2 border-b border-gray-200 peer-checked:bg-gray-100 hover:bg-gray-100",
        innerHTML: folder.name
    });
    let listItem = elemFactory('li', { child: [checkbox, span] });

    listItem.addEventListener("click", () => handleFolderClick(folder, authClient));
    return listItem;
}

/**
 * Returns the SVG icon for a given file type.
 * @param {string} fileType - The MIME type of the file.
 * @returns {HTMLElement} - The span element containing the SVG icon.
 */
function createFileIcon(fileType) {
    if (fileType === mime) {
        const spFolderIcon = document.createElement('span');
        spFolderIcon.className = "float-left pr-2";
        spFolderIcon.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
            </svg>`;
        return spFolderIcon;
    }
    return null; // No icon for non-folders, or handle other file types
}

/**
 * Handles the click event for file/folder list items.
 * @param {object} file - The file or folder object.
 * @param {HTMLElement} checkboxElement - The checkbox element associated with the item.
 */
function handleFileFolderClick(file, checkboxElement) {
    if (file.type !== mime) { // only allows selection for non-folder
        file.checked = !file.checked;
        checkboxElement.checked = file.checked;
    }
}

/**
 * Creates a file/folder list item element for the main display.
 * @param {object} file - The file or folder object.
 * @returns {HTMLElement} - The list item element.
 */
function createFileFolderListItem(file) {
    let cbFileFolder = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-file-folder peer hidden",
        value: file.id
    });
    cbFileFolder.checked = file.checked;

    let spFileFolder = elemFactory('span', {
        "class": "flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto select-none \
                    peer-checked:bg-blue-500 peer-checked:text-white cursor-not-allowed \
                    hover:bg-gray-100 hover:overflow-visible",
    });

    const fileIcon = createFileIcon(file.type);
    if (fileIcon) {
        spFileFolder.appendChild(fileIcon);
        let sptextNode = document.createTextNode(file.name);
        spFileFolder.appendChild(sptextNode);
    } else {
        spFileFolder.classList.remove('cursor-not-allowed');
        spFileFolder.classList.add('cursor-pointer');
        spFileFolder.appendChild(createFileNameWithTooltips(file.name));
    }

    let liFileFolder = elemFactory('li', { child: [cbFileFolder, spFileFolder] });
    liFileFolder.addEventListener("click", () => handleFileFolderClick(file, cbFileFolder));
    return liFileFolder;
}


/**
 * Lists the names and IDs of files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @param {string} source - The ID of the parent folder.
 * @param {string} pageToken - The token for the current page of results.
 */
async function listFiles(authClient, source, pageToken = null) {
    gdrive = google.drive({ version: 'v3', auth: authClient });

    // Upfolder element
    const upcbFolders = elemFactory('input', {
        type: 'checkbox',
        "class": 'cbox-folders peer hidden',
        value: source
    });
    const upSpFolders = elemFactory('span', {
        "class": 'inline-block w-full px-4 py-2 border-b border-gray-200 hover:bg-gray-100 dark:border-gray-600',
        innerHTML: "...",
        child: upcbFolders
    });
    const upListFolders = elemFactory('li', { child: [upcbFolders, upSpFolders] });

    upListFolders.addEventListener("click", () => {
        if (arrParentFolder.length > 1) {
            arrParentFolder.pop();
            // Reset pagination state when going up a folder
            currentPageToken = null;
            nextPageTokenFromAPI = null;
            prevPageTokensStack = [];
        }
        listFiles(authClient, arrParentFolder[arrParentFolder.length - 1]);
        document.querySelectorAll(".cbox-folders").forEach(cb => cb.checked = false);
        upcbFolders.checked = true;
    });

    document.getElementById('folder-list').innerHTML = "";
    document.getElementById('folder-list').appendChild(upListFolders);

    // Fetch folders (always from the first page, no pagination for folders)
    const folderData = await fetchDriveFiles(arrParentFolder[arrParentFolder.length - 1], 'name');
    arrListFolders = folderData.files.filter(file => file.mimeType === mime)
                                .map(file => ({ id: file.id, name: file.name }));

    arrListFolders.forEach(folder => {
        document.getElementById('folder-list').appendChild(createFolderListItem(folder, authClient));
    });

    // Fetch files with pagination
    const fileData = await fetchDriveFiles(arrParentFolder[arrParentFolder.length - 1], 'folder, name', pageToken);
    arrListAllFiles = fileData.files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.mimeType,
        checked: false
    }));

    // Update pagination state based on the fetched data
    currentPageToken = pageToken; // The token we just used to fetch this page
    nextPageTokenFromAPI = fileData.nextPageToken; // The token for the next page, provided by the API

    // Update button states
    prevPageButton.disabled = (currentPageToken === null && prevPageTokensStack.length === 0);
    nextPageButton.disabled = (nextPageTokenFromAPI === null);

    // Update UI
    document.getElementById('file-folder-list').innerHTML = null;
    arrListAllFiles.forEach(file => {
        document.getElementById('file-folder-list').appendChild(createFileFolderListItem(file));
    });

    let firstchildFileList = elemFactory('div', {"class": "h-4 bg-gray-100"});
    document.getElementById('file-folder-list').prepend(firstchildFileList);
}


document.getElementById("authorize").addEventListener('click', async () => {
    // Show UI elements after the first authorize click
    document.getElementById("mfm-opt").classList.remove("invisible");
    document.getElementById("folders").classList.remove("invisible");
    document.getElementById("files").classList.remove("invisible");
    document.getElementById("mfm-play").classList.remove("invisible");
    document.getElementById("pagination-controls").classList.remove("invisible"); // Show pagination controls

    if (authorizeButton) {
        if (isInitialAuthSuccessful) {
            authorizeButton.textContent = 'Refreshing...';
        } else {
            authorizeButton.textContent = 'Loading...';
        }
        authorizeButton.disabled = true;
    }

    try {
        const authClient = await authorize();
        // Reset pagination for initial load
        currentPageToken = null;
        nextPageTokenFromAPI = null;
        prevPageTokensStack = [];
        await listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
        isInitialAuthSuccessful = true;
        showToast('Authorization successful. Ready to go!', 'success');
    } catch (error) {
        showToast('Authorization failed. Please try again.', 'error');
        console.error('Error during authorization or listFiles:', error);
        isInitialAuthSuccessful = false;
    } finally {
        if (authorizeButton) {
            if (isInitialAuthSuccessful) {
                authorizeButton.textContent = 'Refresh';
            } else {
                authorizeButton.textContent = 'Authorize';
            }
            authorizeButton.disabled = false;
        }
    }
});

// Pagination Event Listeners
prevPageButton.addEventListener('click', async () => {
    if (prevPageTokensStack.length > 0) {
        // Pop the current page token (which was the one used to get to the current page)
        // and then use the new top of the stack as the previous page token.
        const prevToken = prevPageTokensStack.pop();
        const authClient = await authorize();
        listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], prevToken);
    }
});

nextPageButton.addEventListener('click', async () => {
    if (nextPageTokenFromAPI) {
        // Before moving to the next page, push the current page token onto the stack
        // unless it's the very first page (null) and the stack is empty.
        if (currentPageToken !== null || prevPageTokensStack.length === 0) {
             prevPageTokensStack.push(currentPageToken);
        }
        
        const authClient = await authorize();
        listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], nextPageTokenFromAPI);
    } else {
        showToast('No more pages.', 'info');
        nextPageButton.disabled = true;
    }
});


/**
 * Gets all currently checked files from the arrListAllFiles array.
 * @returns {Array} An array of checked file objects.
 */
const getCheckedFiles = () => {
    const checkedElements = document.getElementsByClassName('cbox-file-folder');
    return arrListAllFiles.filter((_, index) => checkedElements[index].checked);
};

/**
 * Handles the "Replace Text" operation.
 */
function handleReplaceText() {
    const mfmOptChildren = document.getElementById('mfm-opt').children[0];
    myswal.fire({
        title: mfmOptChildren[1].innerHTML,
        html:
            '<input id="from" placeholder="from" class="' + inputClass + '">' +
            '<input id="to" placeholder="to" class="' + inputClass + '">',
        confirmButtonText: "RUN",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            const from = document.getElementById('from').value;
            const to = document.getElementById('to').value;
            const checkedFiles = getCheckedFiles();
            const renamePromises = checkedFiles.map(file => {
                const newFilename = file.name.replace(from, to);
                return renameFile(file.id, newFilename, file.name);
            });

            try {
                await Promise.all(renamePromises);
                // After renaming, refresh the current page to show updated names
                const authClient = await authorize(); // Ensure client is authorized for refresh
                listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
            } catch (error) {
                showToast('An error occurred during rename.', 'error');
                console.error('Error during rename:', error);
            }
        }
    });
}

/**
 * Handles the "Slice Text" operation.
 */
function handleSliceText() {
    const mfmOptChildren = document.getElementById('mfm-opt').children[0];
    myswal.fire({
        title: mfmOptChildren[2].innerHTML,
        html:
            '<input type="number" id="start" placeholder="start(index)" class="' + inputClass + '">' +
            '<input type="number" id="end" placeholder="end(index)" class="' + inputClass + '">',
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        preConfirm: () => {
            return [
                document.getElementById('start').value,
                document.getElementById('end').value
            ];
        }
    });
}

/**
 * Handles the "Pad Filename" operation.
 */
function handlePadFilename() {
    const mfmOptChildren = document.getElementById('mfm-opt').children[0];
    myswal.fire({
        title: mfmOptChildren[3].innerHTML,
        html:
            '<input id="numprefix" placeholder="expected value" class="' + inputClass + '">',
        confirmButtonText: "RUN",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            const numPrefix = document.getElementById('numprefix').value;
            const checkedFiles = getCheckedFiles();
            const renamePromises = checkedFiles.map(file => {
                const paddedFilename = padFilename(file.name, numPrefix);
                return renameFile(file.id, paddedFilename, file.name);
            });

            try {
                await Promise.all(renamePromises);
                // After renaming, refresh the current page to show updated names
                const authClient = await authorize();
                listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
            } catch (error) {
                showToast('An error occurred while padding filenames.', 'error');
                console.error('Error during pad filename:', error);
            }
        }
    });
}

document.getElementById('mfm-play').addEventListener('click', () => {
    const child = document.getElementById('mfm-opt').children[0];
    const option = child.value;

    switch (option) {
        case '1':
            handleReplaceText();
            break;
        case '2':
            handleSliceText();
            break;
        case '3':
            handlePadFilename();
            break;
        default:
            showToast('No valid option selected.', 'info');
    }
});

/**
 * feature: select multiple with shiftkey + click, like gmail
 * @var fromIndex : first index of the selected file
 * @var toIndex : last index of the selected file
 */
let fromIndex = null;
let toIndex = null;
document.getElementById('file-folder-list').addEventListener('click', (evt) => {
    // Only proceed if it's a click on a checkbox within the list or the list item itself
    const targetCheckbox = evt.target.closest('li')?.querySelector('.cbox-file-folder');
    if (!targetCheckbox) return;

    const clickedIndex = Array.from(document.getElementsByClassName('cbox-file-folder')).indexOf(targetCheckbox);

    if (evt.shiftKey && fromIndex !== null) {
        toIndex = clickedIndex;

        const [low, high] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];

        for (let idx = low; idx <= high; idx++) {
            document.getElementsByClassName('cbox-file-folder')[idx].checked = true;
            arrListAllFiles[idx].checked = true;
        }
    } else {
        // If not shift key, reset fromIndex and update the clicked item's state
        fromIndex = clickedIndex;
        // The handleFileFolderClick on the li already toggles, so no need to explicitly toggle here for single clicks
    }
});