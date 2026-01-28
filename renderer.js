const { fetchDriveFiles, initializePaths, authorizeAndGetDrive } = require('./driveApi');
const { updateState, getState } = require('./state');
const { createFolderListItem, createFileFolderListItem, showMainUI, updateAuthorizeButton, updateExecuteButtonVisibility, updateSelectionBlockVisibility, renderEmptyFileList, renderLoadingIndicator, updateFileListBorderVisibility, updatePaginationVisibility } = require('./ui');
const { setupEventHandlers } = require('./eventHandlers');

async function main() {
  await initializePaths(); // Initialize paths as soon as the app loads
  const eventHandlers = setupEventHandlers(listFiles);
  await startup(eventHandlers.getDriveClient);
}

window.addEventListener('DOMContentLoaded', main);

const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

async function startup(getDriveClient) {
    try {
        const drive = await authorizeAndGetDrive(); // Check for existing token
        if (drive) {
            showMainUI();
            updateAuthorizeButton(true, false);
            getDriveClient(drive); // Set the client in eventHandlers
            const { arrParentFolder, currentPageToken } = getState();
            await listFiles(drive, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
            updateState({ isInitialAuthSuccessful: true });
        }
    } catch (error) {
        console.error('Startup authorization failed, waiting for user action.', error);
        updateAuthorizeButton(false, false);
    }
}

/**
 * Handles the click event for folder list items.
 * @param {object} folder - The folder object.
 * @param {object} driveClient - An authorized Google Drive client.
 */
function handleFolderClick(folder, driveClient) {
    let { arrParentFolder } = getState();
    arrParentFolder.push(folder.id);
    updateState({
        arrParentFolder,
        currentPageToken: null,
        nextPageTokenFromAPI: null,
        prevPageTokensStack: []
    });
    listFiles(driveClient, folder.id);
}

function handleFileFolderClick(file, checkboxElement) {
    const { mime } = getState();
    if (file.type !== mime) {
        file.checked = !file.checked;
        checkboxElement.checked = file.checked;
        updateExecuteButtonVisibility();
    }
}


/**
 * Lists the names and IDs of files.
 * @param {object} driveClient An authorized Google Drive client.
 * @param {string} source - The ID of the parent folder.
 * @param {string} pageToken - The token for the current page of results.
 */
async function listFiles(driveClient, source, pageToken = null) {
    const fileListContainer = document.getElementById('file-folder-list');
    fileListContainer.innerHTML = ''; // Clear previous content
    fileListContainer.appendChild(renderLoadingIndicator()); // Show loading animation

    let { arrParentFolder, mime, currentPageToken, prevPageTokensStack, nextPageTokenFromAPI } = getState();
    // Upfolder element
    const upSpFolders = document.createElement('div');
    // Using classList.add to avoid issues with Tailwind JIT/Purge
    upSpFolders.classList.add('w-full', 'flex', 'items-center', 'justify-center', 'py-2', 'border-b', 'border-gray-200', 'hover:bg-gray-200', 'dark:border-gray-600', 'dark:hover:bg-gray-700', 'cursor-pointer', 'group');
    upSpFolders.innerHTML = `<i class="fas fa-ellipsis text-gray-500 dark:text-gray-400 group-hover:text-white"></i>`;

    const upListFolders = document.createElement('li');
    upListFolders.className = "flex justify-center";
    upListFolders.append(upSpFolders);

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
        listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1]);
    });

    document.getElementById('folder-list').innerHTML = "";
    document.getElementById('folder-list').appendChild(upListFolders);

    // Fetch folders (always from the first page, no pagination for folders)
    const folderData = await fetchDriveFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], 'name');
    const arrListFolders = folderData.files.filter(file => file.mimeType === mime)
                                     .map(file => ({ id: file.id, name: file.name }));
    updateState({ arrListFolders });

    arrListFolders.forEach(folder => {
        // The onClick handler for a folder needs to call handleFolderClick
        const clickHandler = () => handleFolderClick(folder, driveClient);
        document.getElementById('folder-list').appendChild(createFolderListItem(folder, clickHandler));
    });

    // Fetch files with pagination
    const fileData = await fetchDriveFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], 'folder, name', pageToken);
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
    fileListContainer.innerHTML = ""; // Clear loading indicator
    if (arrListAllFiles.length === 0) {
        // Initially, or when empty, show the empty state (Google Drive icon)
        // But we want to ensure the container looks right (no border if empty/initial)
        fileListContainer.appendChild(renderEmptyFileList());
        updateSelectionBlockVisibility(false);
        updateFileListBorderVisibility(false); // No border for empty state
        updatePaginationVisibility(false);
    } else {
        arrListAllFiles.forEach(file => {
            fileListContainer.appendChild(createFileFolderListItem(file, handleFileFolderClick));
        });
        updateSelectionBlockVisibility(true);
        updateFileListBorderVisibility(true); // Add border when files are present
        updatePaginationVisibility(true);
    }

    if (arrListAllFiles.length > 0) {
        let firstchildFileList = document.createElement('li');
        firstchildFileList.className = "h-4 bg-gray-100";
        fileListContainer.prepend(firstchildFileList);
    }

    updateExecuteButtonVisibility();
}
