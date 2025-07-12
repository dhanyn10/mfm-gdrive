const {
    myswal,
    inputClass
} = require('./swal-helpers');

// Import all functions from utils
const {
    showToast,
    elemFactory,
    createFileNameWithTooltips,
    padFilename
} = require('./utils');

// Import functions from driveApi
const {
    authorize,
    renameFile,
    fetchDriveFiles
} = require('./driveApi');

// --- Main Global Variables ---
const mime = "application/vnd.google-apps.folder";
var arrParentFolder = ['root'];
let arrListFolders = [];
let arrListAllFiles = [];

// Variables for pagination
let currentPageToken = null;
let nextPageTokenFromAPI = null;
let prevPageTokensStack = [];

// Get references to DOM elements
const authorizeButton = document.getElementById('authorize');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

// Flag to track if initial authorization was successful
let isInitialAuthSuccessful = false;

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
    return null;
}

/**
 * Handles the click event for file/folder list items.
 * @param {object} file - The file or folder object.
 * @param {HTMLElement} checkboxElement - The checkbox element associated with the item.
 */
function handleFileFolderClick(file, checkboxElement) {
    if (file.type !== mime) {
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
    // Upfolder element
    const upcbFolders = elemFactory('input', {
        type: 'checkbox',
        "class": 'cbox-folders peer hidden',
        value: source
    });
    const upSpFolders = elemFactory('span', {
        "class": 'inline-block w-full px-4 py-2 border-b border-gray-200 hover:bg-gray-100 dark:border-gray-600',
        innerHTML: "...",
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
    currentPageToken = pageToken;
    nextPageTokenFromAPI = fileData.nextPageToken;

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
    document.getElementById("pagination-controls").classList.remove("invisible");

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
        const prevToken = prevPageTokensStack.pop();
        const authClient = await authorize();
        listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], prevToken);
    }
});

nextPageButton.addEventListener('click', async () => {
    if (nextPageTokenFromAPI) {
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
                const authClient = await authorize();
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
            '<input type="number" id="start" placeholder="start (position 1, 2, ...)" class="' + inputClass + '">' +
            '<input type="number" id="end" placeholder="end (position 1, 2, ..., inclusive)" class="' + inputClass + '">', // 'end' is no longer optional
        confirmButtonText: "RUN",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        preConfirm: () => {
            const startInput = document.getElementById('start').value;
            const endInput = document.getElementById('end').value;

            const start = parseInt(startInput);
            const end = parseInt(endInput); // end is now parsed directly, not checked for undefined

            // --- Validation: Both start and end are REQUIRED and must be valid numbers >= 1 ---
            if (isNaN(start) || start < 1) {
                Swal.showValidationMessage('Please enter a valid start position (1 or greater).');
                return false;
            }
            if (isNaN(end) || end < 1) { // End is now mandatory
                Swal.showValidationMessage('Please enter a valid end position (1 or greater).');
                return false;
            }
            // --- End Validation ---

            if (start > end) {
                Swal.showValidationMessage('Start position cannot be greater than end position.');
                return false;
            }
            return { start, end };
        }
    }).then(async (res) => {
        if (res.isConfirmed && res.value) {
            const { start, end } = res.value; // Both start and end are guaranteed to be numbers >= 1

            const checkedFiles = getCheckedFiles();
            if (checkedFiles.length === 0) {
                showToast('No files selected for operation.', 'info');
                return;
            }

            const renamePromises = checkedFiles.map(file => {
                const originalName = file.name;
                const lastDotIndex = originalName.lastIndexOf('.');
                let baseName = originalName;
                let extension = '';

                if (lastDotIndex > 0) { // Check if a dot exists and it's not the first character
                    baseName = originalName.substring(0, lastDotIndex);
                    extension = originalName.substring(lastDotIndex);
                }

                // Apply slicing logic to the baseName only
                const len = baseName.length;
                let actualStart = start - 1;
                let actualEndForSlice = end;

                // Ensure indices are within valid bounds of the baseName
                if (actualStart < 0) actualStart = 0;
                if (actualStart > len) actualStart = len;

                if (actualEndForSlice < actualStart) actualEndForSlice = actualStart;
                if (actualEndForSlice > len) actualEndForSlice = len;
                
                // Logic to construct the new base name
                // Remove characters from 'start' position (1-based) up to and including 'end' position (1-based).
                // This means we combine the part *before* 'start' with the part *after* 'end'.
                const newBaseName = baseName.slice(0, actualStart) + baseName.slice(actualEndForSlice);

                const finalNewName = newBaseName + extension;
                
                // Log the renaming process for debugging purposes
                console.log(`Original: ${originalName}, Sliced Base: ${newBaseName}, Final New: ${finalNewName}`);

                // Return the promise from the actual rename operation
                return renameFile(file.id, finalNewName, originalName);
            });

            // --- Execute all rename operations and handle results ---
            try {
                await Promise.all(renamePromises); // Wait for all rename promises to resolve
                showToast(`Operation 'slice' completed.`, 'success');
                // Refresh the current page view in the UI to reflect the name changes
                const authClient = await authorize();
                await listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
                // No updateHistoryButtons() as history is not saved for this function.
            } catch (error) {
                // Catch any errors during the rename process and display a toast message
                showToast(`An error occurred during slice operation.`, 'error');
                console.error(`Error during slice operation:`, error);
                // If a duplicate name causes an error, it will be caught here.
                // No automatic numbering means the user will have to handle conflicts manually.
            }
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
    }
});
