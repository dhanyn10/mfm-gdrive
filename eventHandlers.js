// eventHandlers.js
const { authorizeAndGetDrive, triggerUserAuthorization } = require('./driveApi');
const { showToast } = require('./utils');
const { updateState, getState } = require('./state');
const { showMainUI, updateRefreshButton, updateExecuteButtonVisibility, renderSidebarForm, setPanelVisibility, updateFileListItemStyles } = require('./ui');
const { executeReplace, executeSlice, executePad } = require('./fileOperations');

let driveClient;

function setupEventHandlers(listFiles) {
    const authorizeButton = document.getElementById('authorize-button');
    const refreshButton = document.getElementById('refresh-button');
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
    const dropdownButton = document.getElementById('dropdown-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const foldersPanel = document.getElementById('folders');
    const executeSidebar = document.getElementById('execute-sidebar');

    // Initial authorization
    authorizeButton.addEventListener('click', () => {
        triggerUserAuthorization();

        const pollingInterval = 2000;
        const pollingTimeout = 120000;

        let pollingHandle;
        const timeoutHandle = setTimeout(() => {
            clearInterval(pollingHandle);
            showToast('Authorization timed out. Please try again.', 'error');
        }, pollingTimeout);

        pollingHandle = setInterval(async () => {
            try {
                const client = await authorizeAndGetDrive();
                if (client) {
                    clearInterval(pollingHandle);
                    clearTimeout(timeoutHandle);
                    driveClient = client;

                    showMainUI();
                    updateState({ isAuthorized: true });
                    const { folderIdStack, currentPageToken } = getState();
                    await listFiles(driveClient, folderIdStack[folderIdStack.length - 1], currentPageToken);
                    showToast('Authorization successful!', 'success');
                }
            } catch (error) {
                clearInterval(pollingHandle);
                clearTimeout(timeoutHandle);
                showToast('An error occurred during authorization.', 'error');
                console.error('Error during authorization polling:', error);
            }
        }, pollingInterval);
    });

    // Refresh button in header
    refreshButton.addEventListener('click', async () => {
        updateRefreshButton(true);
        try {
            const { folderIdStack, currentPageToken } = getState();
            await listFiles(driveClient, folderIdStack[folderIdStack.length - 1], currentPageToken);
            showToast('File list refreshed.', 'success');
        } catch (error) {
            console.error('Error refreshing file list:', error);
            showToast('Failed to refresh file list.', 'error');
        } finally {
            updateRefreshButton(false);
        }
    });

    prevPageButton.addEventListener('click', async () => {
        const { prevPageTokens, folderIdStack } = getState();
        if (prevPageTokens.length > 0) {
            const prevToken = prevPageTokens.pop();
            updateState({ prevPageTokens });
            listFiles(driveClient, folderIdStack[folderIdStack.length - 1], prevToken);
        }
    });

    nextPageButton.addEventListener('click', async () => {
        const { nextPageToken, currentPageToken, prevPageTokens } = getState();
        if (nextPageToken) {
            if (currentPageToken !== null || prevPageTokens.length === 0) {
                prevPageTokens.push(currentPageToken);
            }
            updateState({ prevPageTokens });
            const { folderIdStack } = getState();
            listFiles(driveClient, folderIdStack[folderIdStack.length - 1], nextPageToken);
        } else {
            showToast('No more pages.', 'info');
            nextPageButton.disabled = true;
        }
    });

    selectAllBtn.addEventListener('click', () => {
        const { currentFileList } = getState();
        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        currentFileList.forEach((file, index) => {
            file.checked = true;
            if (checkboxes[index]) {
                checkboxes[index].checked = true;
            }
        });
        updateState({ currentFileList });
        updateExecuteButtonVisibility();
        updateFileListItemStyles();
    });

    selectNoneBtn.addEventListener('click', () => {
        const { currentFileList } = getState();
        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        currentFileList.forEach((file, index) => {
            file.checked = false;
            if (checkboxes[index]) {
                checkboxes[index].checked = false;
            }
        });
        updateState({ currentFileList });
        updateExecuteButtonVisibility();
        updateFileListItemStyles();
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

    if (dropdownButton && dropdownMenu) {
        dropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (event) => {
            if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });

        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const value = e.target.getAttribute('data-value');
                const text = e.target.textContent;
                
                operationSelect.value = value;
                dropdownButton.innerHTML = `${text} <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/></svg>`;
                renderSidebarForm(value);
                dropdownMenu.classList.add('hidden');
            });
        });
    }

    runSidebarExecuteBtn.addEventListener('click', async () => {
        const operation = operationSelect.value;
        const { folderIdStack, currentPageToken } = getState();
        const refresh = () => listFiles(driveClient, folderIdStack[folderIdStack.length - 1], currentPageToken);

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
        const listItem = evt.target.closest('li');
        if (!listItem) return;

        const { currentFileList, FOLDER_MIME_TYPE } = getState();
        const listItems = Array.from(fileFolderList.children);
        const clickedIndex = listItems.indexOf(listItem);
        const file = currentFileList[clickedIndex];

        if (!file || file.type === FOLDER_MIME_TYPE) return;

        const checkbox = listItem.querySelector('.cbox-file-folder');
        if (!checkbox) return;

        let { selectionStartIndex } = getState();

        if (evt.shiftKey && selectionStartIndex !== null) {
            const toIndex = clickedIndex;
            const [low, high] = selectionStartIndex < toIndex ? [selectionStartIndex, toIndex] : [toIndex, selectionStartIndex];
            for (let idx = low; idx <= high; idx++) {
                currentFileList[idx].checked = true;
                const chk = listItems[idx].querySelector('.cbox-file-folder');
                if (chk) chk.checked = true;
            }
        } else {
            file.checked = !file.checked;
            checkbox.checked = file.checked;
        }

        updateState({ currentFileList, selectionStartIndex: clickedIndex });
        updateExecuteButtonVisibility();
        updateFileListItemStyles();
    });

    let isResizing = false;
    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        sidebarResizer.classList.add('bg-blue-500');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const containerWidth = document.querySelector('.container').offsetWidth;
        const x = e.clientX;
        const containerLeft = document.querySelector('.container').getBoundingClientRect().left;
        
        let foldersWidth = 0;
        if (!foldersPanel.classList.contains('hidden')) {
            foldersWidth = foldersPanel.offsetWidth;
        }
        
        const newSidebarWidth = containerWidth - (x - containerLeft);
        
        if (newSidebarWidth > 200 && newSidebarWidth < containerWidth - foldersWidth - 200) {
             executeSidebar.style.width = `${newSidebarWidth}px`;
             executeSidebar.style.flex = 'none';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            sidebarResizer.classList.remove('bg-blue-500');
        }
    });

    return {
        getDriveClient: (client) => { driveClient = client; }
    };
}

module.exports = { setupEventHandlers };
