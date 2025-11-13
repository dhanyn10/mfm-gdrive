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
    const mfmPlayButton = document.getElementById('mfm-play');
    const fileFolderList = document.getElementById('file-folder-list');

    authorizeButton.addEventListener('click', async () => {
        const { isInitialAuthSuccessful } = getState();
        showMainUI();
        updateAuthorizeButton(isInitialAuthSuccessful, true);

        // Trigger the authorization flow in the background
        triggerUserAuthorization();

        // Start polling for the token
        const pollingInterval = 2000; // Check every 2 seconds
        const pollingTimeout = 120000; // Stop after 2 minutes

        let pollingHandle;
        const timeoutHandle = setTimeout(() => {
            clearInterval(pollingHandle);
            showToast('Authorization timed out. Please try again.', 'error');
            updateAuthorizeButton(false, false);
        }, pollingTimeout);

        pollingHandle = setInterval(async () => {
            try {
                const client = await authorizeAndGetDrive(); // This will now only succeed if token.json exists
                if (client) {
                    clearInterval(pollingHandle);
                    clearTimeout(timeoutHandle);
                    driveClient = client;

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
                } else {
                    console.log('Polling for token.json... Not found yet.');
                }
            } catch (error) {
                clearInterval(pollingHandle);
                clearTimeout(timeoutHandle);
                showToast('An error occurred. Please try again.', 'error');
                console.error('Error during polling or listFiles:', error);
                updateAuthorizeButton(false, false);
            }
        }, pollingInterval);
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

    mfmPlayButton.addEventListener('click', () => {
        const child = document.getElementById('mfm-opt').children[0];
        const option = child.value;
        const { arrParentFolder, currentPageToken } = getState();
        const refresh = () => {
            listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
        };

        switch (option) {
            case '1': handleReplaceText(driveClient, refresh); break;
            case '2': handleSliceText(driveClient, refresh); break;
            case '3': handlePadFilename(driveClient, refresh); break;
            default: showToast('No valid option selected.', 'info');
        }
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