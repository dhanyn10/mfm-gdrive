// eventHandlers.js
const { authorizeAndGetDrive, triggerUserAuthorization } = require('./driveApi');
const { showToast, elemFactory } = require('./utils');
const { updateState, getState } = require('./state');
const { showMainUI, updateAuthorizeButton, setRefreshButtonLoading, updateSelectionButtons, toggleExecuteSidebar, renderSidebarForm, setPanelVisibility, updatePreviewCard } = require('./ui');
const { executeReplace, executeSlice, executePad } = require('./fileOperations');

let driveClient;

function setupEventHandlers(listFiles) {
    const authorizeButton = document.getElementById('authorize');
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
    const filesPanel = document.getElementById('files');
    const executeSidebar = document.getElementById('execute-sidebar');

    const handleAuthOrRefreshClick = async () => {
        const isInitialAuth = !getState().isInitialAuthSuccessful;
        if (isInitialAuth) {
            updateAuthorizeButton(false, true);
        } else {
            setRefreshButtonLoading(true);
        }

        try {
            let client = await authorizeAndGetDrive();

            if (client) {
                driveClient = client;
                showMainUI();
                const { arrParentFolder } = getState();
                await listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1]);
                if (isInitialAuth) {
                    showToast('Authorization successful. Ready to go!', 'success');
                    updateState({ isInitialAuthSuccessful: true });
                } else {
                    showToast('File list refreshed.', 'success');
                }
                updateAuthorizeButton(true, false);
            } else {
                triggerUserAuthorization();
                const pollingInterval = 2000;
                const pollingTimeout = 120000;
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
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
            console.error('Error during auth/refresh:', error);
            updateAuthorizeButton(false, false);
        } finally {
            if (!isInitialAuth) {
                setRefreshButtonLoading(false);
            }
        }
    };

    authorizeButton.addEventListener('click', handleAuthOrRefreshClick);
    refreshButton.addEventListener('click', handleAuthOrRefreshClick);

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

    const updatePreview = () => {
        const operationType = operationSelect.value;
        if (['replace', 'pad', 'slice'].includes(operationType)) {
            updatePreviewCard(operationType);
        }
    };

    selectAllBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const allSelected = arrListAllFiles.length > 0 && arrListAllFiles.every(file => file.checked);
        const shouldSelectAll = !allSelected;

        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        const newArrListAllFiles = arrListAllFiles.map((file, index) => {
            if (checkboxes[index]) {
                checkboxes[index].checked = shouldSelectAll;
            }
            return { ...file, checked: shouldSelectAll };
        });
        updateState({ arrListAllFiles: newArrListAllFiles });
        updateSelectionButtons();
        updatePreview();
    });

    selectNoneBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        const newArrListAllFiles = arrListAllFiles.map((file, index) => {
            if (checkboxes[index]) {
                checkboxes[index].checked = false;
            }
            return { ...file, checked: false };
        });
        updateState({ arrListAllFiles: newArrListAllFiles });
        updateSelectionButtons();
        updatePreview();
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

        const checkboxes = Array.from(fileFolderList.querySelectorAll('.cbox-file-folder'));
        const clickedIndex = checkboxes.indexOf(targetCheckbox);
        let { fromIndex, arrListAllFiles } = getState();

        if (evt.shiftKey && fromIndex !== null) {
            const toIndex = clickedIndex;
            const [low, high] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
            
            const newArrListAllFiles = arrListAllFiles.map((file, idx) => {
                if (idx >= low && idx <= high) {
                    checkboxes[idx].checked = true;
                    return { ...file, checked: true };
                }
                return file;
            });
            updateState({ arrListAllFiles: newArrListAllFiles });
        }
        
        updateState({ fromIndex: clickedIndex });
        updateSelectionButtons();
        updatePreview();
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