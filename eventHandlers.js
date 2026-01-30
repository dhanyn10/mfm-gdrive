// eventHandlers.js
const { authorizeAndGetDrive, triggerUserAuthorization } = require('./driveApi');
const { showToast, elemFactory } = require('./utils');
const { updateState, getState } = require('./state');
const { 
    showMainUI, 
    updateAuthorizeButton, 
    setRefreshButtonLoading, 
    updateSelectionButtons, 
    toggleExecuteSidebar, 
    renderSidebarForm, 
    setPanelVisibility, 
    updatePreviewCard 
} = require('./ui');
const { executeReplace, executeSlice, executePad } = require('./fileOperations');

/**
 * Stores the authorized Google Drive client instance.
 * @type {import('googleapis').drive_v3.Drive}
 */
let driveClient;

/**
 * Sets up all global event listeners for the application.
 * This function is called once during application startup.
 * @param {function} listFiles - A function from renderer.js to refresh the file list.
 * @returns {{getDriveClient: function(import('googleapis').drive_v3.Drive): void}} An object containing a method to set the drive client.
 */
function setupEventHandlers(listFiles) {
    // Get references to various DOM elements.
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
    const filesPanel = document.getElementById('files'); // This variable is declared but not used.
    const executeSidebar = document.getElementById('execute-sidebar');

    /**
     * Handles the click event for both the authorization and refresh buttons.
     * It attempts to authorize with Google Drive or refresh the existing token.
     */
    const handleAuthOrRefreshClick = async () => {
        const isInitialAuth = !getState().isInitialAuthSuccessful;
        if (isInitialAuth) {
            updateAuthorizeButton(false, true); // Show loading state for initial auth.
        } else {
            setRefreshButtonLoading(true); // Show loading state for refresh.
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
                updateAuthorizeButton(true, false); // Hide authorize button, show refresh.
            } else {
                // If no client, trigger interactive authorization and poll for completion.
                triggerUserAuthorization();
                const pollingInterval = 2000; // Poll every 2 seconds.
                const pollingTimeout = 120000; // Timeout after 2 minutes.
                let pollingHandle;
                const timeoutHandle = setTimeout(() => {
                    clearInterval(pollingHandle);
                    showToast('Authorization timed out. Please try again.', 'error');
                    updateAuthorizeButton(false, false); // Reset button state.
                }, pollingTimeout);
        
                pollingHandle = setInterval(async () => {
                    try {
                        client = await authorizeAndGetDrive();
                        if (client) {
                            clearInterval(pollingHandle);
                            clearTimeout(timeoutHandle);
                            driveClient = client;
        
                            showMainUI();
                            // Reset pagination state after successful authorization.
                            updateState({
                                currentPageToken: null,
                                nextPageTokenFromAPI: null,
                                prevPageTokensStack: []
                            });
                            const { arrParentFolder, currentPageToken } = getState();
                            await listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);                        
                            updateState({ isInitialAuthSuccessful: true });
                            showToast('Authorization successful. Ready to go!', 'success');
                            updateAuthorizeButton(true, false); // Hide authorize button, show refresh.
                        }
                    } catch (error) {
                        // Handle errors during polling.
                        clearInterval(pollingHandle);
                        clearTimeout(timeoutHandle);
                        showToast('An error occurred during authorization. Please try again.', 'error');
                        console.error('Error during polling or listFiles:', error);
                        updateAuthorizeButton(false, false); // Reset button state.
                    }
                }, pollingInterval);
            }
        } catch (error) {
            // Handle errors during initial auth/refresh attempt.
            showToast('An error occurred. Please try again.', 'error');
            console.error('Error during auth/refresh:', error);
            updateAuthorizeButton(false, false); // Reset button state.
        } finally {
            if (!isInitialAuth) {
                setRefreshButtonLoading(false); // Hide loading state for refresh.
            }
        }
    };

    // Attach event listeners to authorization and refresh buttons.
    authorizeButton.addEventListener('click', handleAuthOrRefreshClick);
    refreshButton.addEventListener('click', handleAuthOrRefreshClick);

    // Event listener for the "Previous Page" button.
    prevPageButton.addEventListener('click', async () => {
        const { prevPageTokensStack, arrParentFolder } = getState();
        if (prevPageTokensStack.length > 0) {
            const prevToken = prevPageTokensStack.pop(); // Get the previous page token.
            updateState({ prevPageTokensStack }); // Update state.
            listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], prevToken); // Load previous page.
        }
    });

    // Event listener for the "Next Page" button.
    nextPageButton.addEventListener('click', async () => {
        const { nextPageTokenFromAPI, currentPageToken, prevPageTokensStack } = getState();
        if (nextPageTokenFromAPI) {
            // Save current page token to stack if not already there or if it's the first page.
            if (currentPageToken !== null || prevPageTokensStack.length === 0) {
                prevPageTokensStack.push(currentPageToken);
            }
            updateState({ prevPageTokensStack }); // Update state.
            const { arrParentFolder } = getState();
            listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], nextPageTokenFromAPI); // Load next page.
        } else {
            showToast('No more pages.', 'info');
            nextPageButton.disabled = true; // Disable if no next page.
        }
    });

    /**
     * Updates the preview card based on the currently selected operation.
     */
    const updatePreview = () => {
        const operationType = operationSelect.value;
        if (['replace', 'pad', 'slice'].includes(operationType)) {
            updatePreviewCard(operationType);
        }
    };

    // Event listener for the "Select All" button.
    selectAllBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const allSelected = arrListAllFiles.length > 0 && arrListAllFiles.every(file => file.checked);
        const shouldSelectAll = !allSelected; // Toggle selection.

        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        // Update checked status for all files in state and DOM.
        const newArrListAllFiles = arrListAllFiles.map((file, index) => {
            if (checkboxes[index]) {
                checkboxes[index].checked = shouldSelectAll;
            }
            return { ...file, checked: shouldSelectAll };
        });
        updateState({ arrListAllFiles: newArrListAllFiles });
        updateSelectionButtons(); // Update UI for selection buttons.
        updatePreview(); // Update preview card.
    });

    // Event listener for the "Select None" button.
    selectNoneBtn.addEventListener('click', () => {
        const { arrListAllFiles } = getState();
        const listContainer = document.getElementById('file-folder-list');
        const checkboxes = listContainer.querySelectorAll('.cbox-file-folder');

        // Uncheck all files in state and DOM.
        const newArrListAllFiles = arrListAllFiles.map((file, index) => {
            if (checkboxes[index]) {
                checkboxes[index].checked = false;
            }
            return { ...file, checked: false };
        });
        updateState({ arrListAllFiles: newArrListAllFiles });
        updateSelectionButtons(); // Update UI for selection buttons.
        updatePreview(); // Update preview card.
    });

    // Event listener for the "Next Step" button (to open the execute sidebar).
    nextStepBtn.addEventListener('click', () => {
        setPanelVisibility('execute-sidebar', true);
    });

    // Event listener for the "Folders" navigation button.
    navFolders.addEventListener('click', () => {
        const folders = document.getElementById('folders');
        const isVisible = !folders.classList.contains('hidden');
        setPanelVisibility('folders', !isVisible); // Toggle visibility of folders panel.
    });

    // Event listener for the "Execute" navigation button.
    navExecute.addEventListener('click', () => {
        const sidebar = document.getElementById('execute-sidebar');
        const isVisible = !sidebar.classList.contains('hidden');
        setPanelVisibility('execute-sidebar', !isVisible); // Toggle visibility of execute sidebar.
    });

    // Dropdown menu functionality for operation selection.
    if (dropdownButton && dropdownMenu) {
        dropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden'); // Toggle dropdown visibility.
        });

        // Close dropdown if clicked outside.
        document.addEventListener('click', (event) => {
            if (!dropdownButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });

        // Handle selection of dropdown items.
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const value = e.target.getAttribute('data-value');
                const text = e.target.textContent;
                
                operationSelect.value = value; // Set the hidden select's value.
                // Update the visible dropdown button text.
                dropdownButton.innerHTML = `${text} <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/></svg>`;
                renderSidebarForm(value); // Render the appropriate form in the sidebar.
                dropdownMenu.classList.add('hidden'); // Hide dropdown.
            });
        });
    }

    // Event listener for the "Run" button in the sidebar to execute file operations.
    runSidebarExecuteBtn.addEventListener('click', async () => {
        const operation = operationSelect.value;
        const { arrParentFolder, currentPageToken } = getState();
        // Define a refresh function to reload the current folder's files after an operation.
        const refresh = () => listFiles(driveClient, arrParentFolder[arrParentFolder.length - 1], currentPageToken);

        // Execute the selected operation.
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

    // Event listener for clicks on the file/folder list, handling selection and shift-click.
    fileFolderList.addEventListener('click', (evt) => {
        const targetCheckbox = evt.target.closest('li')?.querySelector('.cbox-file-folder');
        if (!targetCheckbox) return;

        const checkboxes = Array.from(fileFolderList.querySelectorAll('.cbox-file-folder'));
        const clickedIndex = checkboxes.indexOf(targetCheckbox);
        let { fromIndex, arrListAllFiles } = getState();

        // Handle shift-click for range selection.
        if (evt.shiftKey && fromIndex !== null) {
            const toIndex = clickedIndex;
            const [low, high] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
            
            // Update checked status for files within the selected range.
            const newArrListAllFiles = arrListAllFiles.map((file, idx) => {
                if (idx >= low && idx <= high) {
                    checkboxes[idx].checked = true;
                    return { ...file, checked: true };
                }
                return file;
            });
            updateState({ arrListAllFiles: newArrListAllFiles });
        }
        
        updateState({ fromIndex: clickedIndex }); // Store the last clicked index.
        updateSelectionButtons(); // Update UI for selection buttons.
        updatePreview(); // Update preview card.
    });

    // Sidebar resizing functionality.
    let isResizing = false;

    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize'; // Change cursor to indicate resizing.
        sidebarResizer.classList.add('bg-blue-500'); // Highlight resizer.
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
        
        // Constrain sidebar width within reasonable limits.
        if (newSidebarWidth > 200 && newSidebarWidth < containerWidth - foldersWidth - 200) {
             executeSidebar.style.width = `${newSidebarWidth}px`;
             executeSidebar.style.flex = 'none'; // Prevent flexbox from overriding width.
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default'; // Reset cursor.
            sidebarResizer.classList.remove('bg-blue-500'); // Remove resizer highlight.
        }
    });

    // Return a method to allow other modules to set the drive client.
    return {
        getDriveClient: (client) => { driveClient = client; }
    };
}

module.exports = { setupEventHandlers };