const {
    authorize,
    fetchDriveFiles,
    initializePaths
} = require('./driveApi');
const { updateState, getState } = require('./state');
const { elemFactory } = require('./utils');
const { createFolderListItem, createFileFolderListItem } = require('./ui');
const { setupEventHandlers } = require('./eventHandlers');

initializePaths(); // Initialize paths as soon as the app loads
setupEventHandlers(listFiles);

const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

/**
 * Handles the click event for folder list items.
 * @param {object} folder - The folder object.
 * @param {OAuth2Client} authClient - An authorized OAuth2 client.
 */
function handleFolderClick(folder, authClient) {
    let { arrParentFolder } = getState();
    arrParentFolder.push(folder.id);
    updateState({
        arrParentFolder,
        currentPageToken: null,
        nextPageTokenFromAPI: null,
        prevPageTokensStack: []
    });
    listFiles(authClient, folder.id);
}

function handleFileFolderClick(file, checkboxElement) {
    const { mime } = getState();
    if (file.type !== mime) {
        file.checked = !file.checked;
        checkboxElement.checked = file.checked;
    }
}


/**
 * Lists the names and IDs of files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @param {string} source - The ID of the parent folder.
 * @param {string} pageToken - The token for the current page of results.
 */
async function listFiles(authClient, source, pageToken = null) {
    let { arrParentFolder, mime, currentPageToken, prevPageTokensStack, nextPageTokenFromAPI } = getState();
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
            updateState({
                arrParentFolder,
                currentPageToken: null,
                nextPageTokenFromAPI: null,
                prevPageTokensStack: []
            });
        }
        listFiles(authClient, arrParentFolder[arrParentFolder.length - 1]);
        document.querySelectorAll(".cbox-folders").forEach(cb => cb.checked = false);
        upcbFolders.checked = true;
    });

    document.getElementById('folder-list').innerHTML = "";
    document.getElementById('folder-list').appendChild(upListFolders);

    // Fetch folders (always from the first page, no pagination for folders)
    const folderData = await fetchDriveFiles(arrParentFolder[arrParentFolder.length - 1], 'name');
    const arrListFolders = folderData.files.filter(file => file.mimeType === mime)
                                     .map(file => ({ id: file.id, name: file.name }));
    updateState({ arrListFolders });

    arrListFolders.forEach(folder => {
        // The onClick handler for a folder needs to call handleFolderClick
        const clickHandler = () => handleFolderClick(folder, authClient);
        document.getElementById('folder-list').appendChild(createFolderListItem(folder, clickHandler));
    });

    // Fetch files with pagination
    const fileData = await fetchDriveFiles(arrParentFolder[arrParentFolder.length - 1], 'folder, name', pageToken);
    const arrListAllFiles = fileData.files
        .filter(file => file.mimeType !== mime) // Only show files, not folders
        .map(file => ({
            id: file.id,
            name: file.name,
            type: file.mimeType,
            checked: false
        }));

    // Update pagination state based on the fetched data
    updateState({
        arrListAllFiles,
        currentPageToken: pageToken,
        nextPageTokenFromAPI: fileData.nextPageToken
    });

    // Update button states
    ({ currentPageToken, prevPageTokensStack, nextPageTokenFromAPI } = getState());
    prevPageButton.disabled = (currentPageToken === null && prevPageTokensStack.length === 0);
    nextPageButton.disabled = (nextPageTokenFromAPI === null);

    // Update UI
    document.getElementById('file-folder-list').innerHTML = null;
    arrListAllFiles.forEach(file => {
        document.getElementById('file-folder-list').appendChild(createFileFolderListItem(file, handleFileFolderClick));
    });

    let firstchildFileList = elemFactory('div', {"class": "h-4 bg-gray-100"});
    document.getElementById('file-folder-list').prepend(firstchildFileList);
}
