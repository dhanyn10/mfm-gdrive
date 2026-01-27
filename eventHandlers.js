// eventHandlers.js
const { authorizeAndGetDrive, triggerUserAuthorization } = require('./driveApi');
const { showToast, elemFactory } = require('./utils');
const { updateState, getState } = require('./state');
const { showMainUI, updateAuthorizeButton, updateExecuteButtonVisibility, toggleExecuteSidebar, renderSidebarForm, setPanelVisibility } = require('./ui');
const { executeReplace, executeSlice, executePad } = require('./fileOperations');

let driveClient;

function setupEventHandlers(listFiles) {
    const authorizeButton = document.getElementById('authorize');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const selectAllBtn = document.getElementById('select-all');
    const selectNoneBtn = document.getElementById('select-none');
    const nextStepBtn = document.getElementById('next-step-btn');
    const navFolders = document.getElementById('nav-folders');
    const navExecute = document.getElementById('nav-execute');
    const operationSelect = document.getElementById('operation-select');
    const runSidebarExecuteBtn = document.getElementById('run-sidebar-execute');
    const fileFolderList = document.getElementById('file-folder-list');

    authorizeButton.addEventListener('click', async () => {
        updateAuthorizeButton(getState().isInitialAuthSuccessful, true);

        // Check for an existing token first.
        let client = await authorizeAndGetDrive();

        if (client) {
            // Token exists, refresh file list.
            driveClient = client;
            showMainUI();
            const { arrParentFolder } = getState();
            await listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1]);
            showToast('File list refreshed.', 'success');
            updateAuthorizeButton(true, false);
        } else {
            // No token found, so we need to authorize.
            triggerUserAuthorization();

            // Start polling for the token to be created.
            const pollingInterval = 2000; // Check every 2 seconds
            const pollingTimeout = 120000; // 2 minutes timeout

            let pollingHandle;
            const timeoutHandle = setTimeout(() => {
                clearInterval(pollingHandle);
                showToast('Authorization timed out. Please try again.', 'error');
                updateAuthorizeButton(false, false);
            }, pollingTimeout);
    
            pollingHandle = setInterval(async () => {
                try {
                    client = await authorizeAndGetDrive();
                    if (client) {
                        clearInterval(pollingHandle);
                        clearTimeout(timeoutHandle);
                        driveClient = client;
    
                        showMainUI();
                        updateState({
                            currentPageToken: null,
                            nextPageTokenFromAPI: null,
                            prevPageTokensStack: []
                        });
                        const { arrParentFolder, currentPageToken } = getState();
                        await listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);                        
                        updateState({ isInitialAuthSuccessful: true });
                        showToast('Authorization successful. Ready to go!', 'success');
                        updateAuthorizeButton(true, false);
                    }
                } catch (error) {
                    clearInterval(pollingHandle);
                    clearTimeout(timeoutHandle);
                    showToast('An error occurred. Please try again.', 'error');
                    console.error('Error during polling or listFiles:', error);
                    updateAuthorizeButton(false, false);
                }
            }, pollingInterval);
        }
    });

    prevPageButton.addEventListener('click', async () => {
        const { prevPageTokensStack, arrParentFolder } = getState();
        if (prevPageTokensStack.length > 0) {
            const prevToken = prevPageTokensStack.pop();
            updateState({ prevPageTokensStack });
            listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], prevToken);
        }
    });

    nextPageButton.addEventListener('click', async () => {
        const { nextPageTokenFromAPI, currentPageToken, prevPageTokensStack } = getState();
        if (nextPageTokenFromAPI) {
            if (currentPageToken !== null || prevPageTokensStack.length === 0) {
                prevPageTokensStack.push(currentPageToken);
            }
            updateState({ prevPageTokensStack });
            const { arrParentFolder } = getState();
            listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], nextPageTokenFromAPI);
        } else {
            showToast('No more pages.', 'info');
            nextPageButton.disabled = true;
        }
    });

    selectAllBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        arrListAllFiles.forEach((file, index) => {
            file.checked = true;
            // Safer mapping: find checkbox by value (file.id) if possible,
            // but for now relying on list order which is strictly files here.
            if (checkboxes[index]) {
                checkboxes[index].checked = true;
            }
        });
        updateState({ arrListAllFiles });
        updateExecuteButtonVisibility();
    });

    selectNoneBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        arrListAllFiles.forEach((file, index) => {
            file.checked = false;
            if (checkboxes[index]) {
                checkboxes[index].checked = false;
            }
        });
        updateState({ arrListAllFiles });
        updateExecuteButtonVisibility();
    });

    nextStepBtn.addEventListener('click', () => {
        setPanelVisibility('execute-sidebar', true);
    });

    navFolders.addEventListener('click', () => {
        const folders = document.getElementById('folders');
        const isVisible = !folders.classList.contains('hidden');
        setPanelVisibility('folders', !isVisible);
    });

    navExecute.addEventListener('click', () => {
        const sidebar = document.getElementById('execute-sidebar');
        const isVisible = !sidebar.classList.contains('hidden');
        setPanelVisibility('execute-sidebar', !isVisible);
    });

    operationSelect.addEventListener('change', (e) => {
        renderSidebarForm(e.target.value);
    });

    runSidebarExecuteBtn.addEventListener('click', async () => {
        const operation = operationSelect.value;
        const { arrParentFolder, currentPageToken } = getState();
        const refresh = () => listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);

        if (operation === 'replace') {
            const from = document.getElementById('sidebar-from').value;
            const to = document.getElementById('sidebar-to').value;
            await executeReplace(driveClient, from, to, refresh);
        } else if (operation === 'slice') {
            const start = document.getElementById('sidebar-start').value;
            const end = document.getElementById('sidebar-end').value;
            await executeSlice(driveClient, parseInt(start), parseInt(end), refresh);
        } else if (operation === 'pad') {
            const length = document.getElementById('sidebar-pad-length').value;
            await executePad(driveClient, parseInt(length), refresh);
        }
    });

    fileFolderList.addEventListener('click', (evt) => {
        const targetCheckbox = evt.target.closest('li')?.querySelector('.cbox-file-folder');
        if (!targetCheckbox) return;

        const checkboxes = fileFolderList.querySelectorAll('.cbox-file-folder');
        const clickedIndex = Array.from(checkboxes).indexOf(targetCheckbox);
        let { fromIndex, arrListAllFiles } = getState();

        if (evt.shiftKey && fromIndex !== null) {
            const toIndex = clickedIndex;
            const [low, high] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
            for (let idx = low; idx <= high; idx++) {
                checkboxes[idx].checked = true;
                arrListAllFiles[idx].checked = true;
            }
        }
        updateState({ fromIndex: clickedIndex });
        updateExecuteButtonVisibility();
    });

    return {
        getDriveClient: (client) => { driveClient = client; }
    };
}

module.exports = { setupEventHandlers };