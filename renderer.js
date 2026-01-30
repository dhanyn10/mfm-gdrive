// renderer.js
const { fetchDriveFiles, initializePaths, authorizeAndGetDrive } = require('./driveApi');
const { updateState, getState } = require('./state');
const { 
    createFolderListItem, 
    createFileFolderListItem, 
    showMainUI, 
    updateAuthorizeButton, 
    setRefreshButtonLoading, 
    updateSelectionButtons, 
    updateSelectionBlockVisibility, 
    renderEmptyFileList, 
    renderLoadingIndicator, 
    updateFileListBorderVisibility, 
    updatePaginationVisibility, 
    updatePreviewCard 
} = require('./ui');
const { setupEventHandlers } = require('./eventHandlers');

/**
 * Main entry point for the renderer process.
 * Initializes paths, sets up event handlers, and performs startup authorization.
 */
async function main() {
    await initializePaths(); // Initialize paths as soon as the app loads.
    const eventHandlers = setupEventHandlers(listFiles);
    await startup(eventHandlers.getDriveClient);
}

window.addEventListener('DOMContentLoaded', main);

const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

/**
 * Performs initial startup tasks.
 * It tries to authorize with existing credentials and fetches the initial file list.
 * @param {function} getDriveClient - A function to set the drive client in other modules.
 */
async function startup(getDriveClient) {
    try {
        const drive = await authorizeAndGetDrive(); // Check for an existing token.
        if (drive) {
            showMainUI();
            updateAuthorizeButton(true, false);
            getDriveClient(drive); // Set the client in eventHandlers.
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
 * Handles the click event for a folder list item.
 * Navigates into the selected folder and refreshes the file list.
 * @param {object} folder - The folder object that was clicked.
 * @param {import('googleapis').drive_v3.Drive} drive - An authorized Google Drive client.
 */
function handleFolderClick(folder, drive) {
    let { arrParentFolder } = getState();
    arrParentFolder.push(folder.id);
    updateState({
        arrParentFolder,
        currentPageToken: null,
        nextPageTokenFromAPI: null,
        prevPageTokensStack: []
    });
    listFiles(drive, folder.id);
}

/**
 * Handles the click event for a file/folder list item's checkbox.
 * Toggles the 'checked' state of the file and updates the UI.
 * @param {object} file - The file object associated with the clicked item.
 * @param {HTMLInputElement} checkboxElement - The checkbox element that was clicked.
 */
function handleFileFolderClick(file, checkboxElement) {
    const { mime, arrListAllFiles } = getState();
    if (file.type === mime) return; // Ignore clicks on folders in the file list.

    // Create a new array with the updated checked status for the clicked file.
    const updatedFileList = arrListAllFiles.map(f => {
        if (f.id === file.id) {
            return { ...f, checked: !f.checked };
        }
        return f;
    });

    // Update the global state with the new array.
    updateState({ arrListAllFiles: updatedFileList });

    // Update the DOM to reflect the new state.
    const updatedFile = updatedFileList.find(f => f.id === file.id);
    if (updatedFile) {
        checkboxElement.checked = updatedFile.checked;
    }

    updateSelectionButtons();

    // Also update the preview card if an operation is selected.
    const operationType = document.getElementById('sidebar-operation-select').value;
    if (['replace', 'pad', 'slice'].includes(operationType)) {
        updatePreviewCard(operationType);
    }
}

/**
 * Fetches and displays the list of files and folders from Google Drive.
 * @param {import('googleapis').drive_v3.Drive} drive - An authorized Google Drive client.
 * @param {string} parentId - The ID of the parent folder to list content from.
 * @param {string|null} [pageToken=null] - The token for the page of results to fetch.
 */
async function listFiles(drive, parentId, pageToken = null) {
    const fileListContainer = document.getElementById('file-folder-list');
    fileListContainer.innerHTML = ''; // Clear previous content.
    fileListContainer.appendChild(renderLoadingIndicator()); // Show loading animation.
    setRefreshButtonLoading(true);

    try {
        let { arrParentFolder, mime, currentPageToken, prevPageTokensStack, nextPageTokenFromAPI } = getState();
        
        // "Up" folder navigation element.
        const upFolderIconContainer = document.createElement('div');
        upFolderIconContainer.classList.add('w-full', 'flex', 'items-center', 'justify-center', 'py-2', 'border-b', 'border-gray-200', 'hover:bg-gray-200', 'dark:border-gray-600', 'dark:hover:bg-gray-700', 'cursor-pointer', 'group');
        upFolderIconContainer.innerHTML = `<i class="fas fa-ellipsis text-gray-500 dark:text-gray-400 group-hover:text-white"></i>`;

        const upFolderListItem = document.createElement('li');
        upFolderListItem.className = "flex justify-center";
        upFolderListItem.append(upFolderIconContainer);

        upFolderListItem.addEventListener("click", () => {
            if (arrParentFolder.length > 1) {
                arrParentFolder.pop();
                updateState({
                    arrParentFolder,
                    currentPageToken: null,
                    nextPageTokenFromAPI: null,
                    prevPageTokensStack: []
                });
            }
            listFiles(drive, arrParentFolder[arrParentFolder.length - 1]);
        });

        document.getElementById('folder-list').innerHTML = "";
        document.getElementById('folder-list').appendChild(upFolderListItem);

        // Fetch folders (always from the first page, no pagination for folders).
        const folderData = await fetchDriveFiles(drive, arrParentFolder[arrParentFolder.length - 1], 'name');
        const arrListFolders = folderData.files.filter(file => file.mimeType === mime)
                                         .map(file => ({ id: file.id, name: file.name }));
        updateState({ arrListFolders });

        arrListFolders.forEach(folder => {
            const clickHandler = () => handleFolderClick(folder, drive);
            document.getElementById('folder-list').appendChild(createFolderListItem(folder, clickHandler));
        });

        // Fetch files with pagination.
        const fileData = await fetchDriveFiles(drive, arrParentFolder[arrParentFolder.length - 1], 'folder, name', pageToken);
        const arrListAllFiles = fileData.files
            .filter(file => file.mimeType !== mime) // Only show files, not folders.
            .map(file => ({
                id: file.id,
                name: file.name,
                type: file.mimeType,
                checked: false
            }));

        // Update pagination state.
        updateState({
            arrListAllFiles,
            currentPageToken: pageToken,
            nextPageTokenFromAPI: fileData.nextPageToken
        });

        // Update pagination button states.
        ({ currentPageToken, prevPageTokensStack, nextPageTokenFromAPI } = getState());
        prevPageButton.disabled = (currentPageToken === null && prevPageTokensStack.length === 0);
        nextPageButton.disabled = (nextPageTokenFromAPI === null);

        // Update UI.
        fileListContainer.innerHTML = ""; // Clear loading indicator.
        if (arrListAllFiles.length === 0) {
            fileListContainer.appendChild(renderEmptyFileList());
            updateSelectionBlockVisibility(false);
            updateFileListBorderVisibility(false);
            updatePaginationVisibility(false);
        } else {
            arrListAllFiles.forEach(file => {
                fileListContainer.appendChild(createFileFolderListItem(file, handleFileFolderClick));
            });
            updateSelectionBlockVisibility(true);
            updateFileListBorderVisibility(true);
            updatePaginationVisibility(true);
        }

        updateSelectionButtons();
    } catch (error) {
        console.error('Error listing files:', error);
        fileListContainer.innerHTML = '<p class="text-red-500 p-4">Failed to load files. Please try again.</p>';
    } finally {
        setRefreshButtonLoading(false);
    }
}
