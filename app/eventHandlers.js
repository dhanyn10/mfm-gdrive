// eventHandlers.js
const { authorize } = require('./driveApi');
const { showToast, elemFactory } = require('./utils');
const { updateState, getState } = require('./state');
const { showMainUI, updateAuthorizeButton } = require('./ui');
const { handleReplaceText, handleSliceText, handlePadFilename } = require('./fileOperations');

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

        try {
            const authClient = await authorize();
            updateState({
                currentPageToken: null,
                nextPageTokenFromAPI: null,
                prevPageTokensStack: []
            });
            const { arrParentFolder, currentPageToken } = getState();
            await listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
            updateState({ isInitialAuthSuccessful: true });
            showToast('Authorization successful. Ready to go!', 'success');
        } catch (error) {
            showToast('Authorization failed. Please try again.', 'error');
            console.error('Error during authorization or listFiles:', error);
            updateState({ isInitialAuthSuccessful: false });
        } finally {
            const { isInitialAuthSuccessful } = getState();
            updateAuthorizeButton(isInitialAuthSuccessful, false);
        }
    });

    prevPageButton.addEventListener('click', async () => {
        const { prevPageTokensStack, arrParentFolder } = getState();
        if (prevPageTokensStack.length > 0) {
            const prevToken = prevPageTokensStack.pop();
            updateState({ prevPageTokensStack });
            const authClient = await authorize();
            listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], prevToken);
        }
    });

    nextPageButton.addEventListener('click', async () => {
        const { nextPageTokenFromAPI, currentPageToken, prevPageTokensStack } = getState();
        if (nextPageTokenFromAPI) {
            if (currentPageToken !== null || prevPageTokensStack.length === 0) {
                prevPageTokensStack.push(currentPageToken);
            }
            updateState({ prevPageTokensStack });
            const authClient = await authorize();
            const { arrParentFolder } = getState();
            listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], nextPageTokenFromAPI);
        } else {
            showToast('No more pages.', 'info');
            nextPageButton.disabled = true;
        }
    });

    mfmPlayButton.addEventListener('click', () => {
        const child = document.getElementById('mfm-opt').children[0];
        const option = child.value;
        const { arrParentFolder, currentPageToken } = getState();
        const refresh = async () => {
            const authClient = await authorize();
            await listFiles(authClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);
        };

        switch (option) {
            case '1': handleReplaceText(refresh); break;
            case '2': handleSliceText(refresh); break;
            case '3': handlePadFilename(refresh); break;
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
}

module.exports = { setupEventHandlers };