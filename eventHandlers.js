// eventHandlers.js
const { authorizeAndGetDrive, triggerUserAuthorization } = require('./driveApi');
const { showToast, elemFactory } = require('./utils');
const { updateState, getState } = require('./state');
const { showMainUI, updateAuthorizeButton } = require('./ui');
const { handleReplaceText, handleSliceText, handlePadFilename } = require('./fileOperations');

let driveClient;

function setupEventHandlers(listFiles) {
    const authorizeButton = document.getElementById('authorize');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const selectAllBtn = document.getElementById('select-all');
    const selectNoneBtn = document.getElementById('select-none');
    const executeBtn = document.getElementById('execute-btn');
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
        const checkboxes = document.getElementsByClassName('cbox-file-folder');
        arrListAllFiles.forEach((file, index) => {
            file.checked = true;
            if (checkboxes[index]) {
                checkboxes[index].checked = true;
            }
        });
        updateState({ arrListAllFiles });
    });

    executeBtn.addEventListener('click', () => {
        showToast('Execute clicked. Functionality coming soon!', 'info');
    });

    selectNoneBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const checkboxes = document.getElementsByClassName('cbox-file-folder');
        arrListAllFiles.forEach((file, index) => {
            file.checked = false;
            if (checkboxes[index]) {
                checkboxes[index].checked = false;
            }
        });
        updateState({ arrListAllFiles });
    });

    fileFolderList.addEventListener('click', (evt) => {
        const targetCheckbox = evt.target.closest('li')?.querySelector('.cbox-file-folder');
        if (!targetCheckbox) return;

        const clickedIndex = Array.from(document.getElementsByClassName('cbox-file-folder')).indexOf(targetCheckbox);
        let { fromIndex, arrListAllFiles } = getState();

        if (evt.shiftKey && fromIndex !== null) {
            const toIndex = clickedIndex;
            const [low, high] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
            for (let idx = low; idx <= high; idx++) {
                document.getElementsByClassName('cbox-file-folder')[idx].checked = true;
                arrListAllFiles[idx].checked = true;
            }
        }
        updateState({ fromIndex: clickedIndex });
    });

    return {
        getDriveClient: (client) => { driveClient = client; }
    };
}

module.exports = { setupEventHandlers };