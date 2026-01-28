// ui.js
const { elemFactory, createFileNameWithTooltips } = require('./utils');
const { getState } = require('./state');

/**
 * Returns the SVG icon for a given file type.
 * @param {string} fileType - The MIME type of the file.
 * @returns {HTMLElement|null} - The span element containing the SVG icon, or null.
 */
function createFileIcon(fileType) {
    const { mime } = getState();
    if (fileType === mime) {
        const spFolderIcon = document.createElement('span');
        spFolderIcon.className = "float-left pr-2";
        spFolderIcon.innerHTML = `<i class="fas fa-folder w-5 h-5"></i>`;
        return spFolderIcon;
    }
    return null;
}

/**
 * Creates a folder list item element.
 * @param {object} folder - The folder object.
 * @param {function} onClick - The click handler function.
 * @returns {HTMLElement} - The list item element.
 */
function createFolderListItem(folder, onClick) {
    let checkbox = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-folders peer hidden",
        value: folder.id
    });
    let span = elemFactory('span', {
        "class": "inline-block w-full px-4 py-2 border-b border-gray-200 peer-checked:bg-gray-100 hover:bg-gray-100",
        innerHTML: folder.name
    });
    let listItem = elemFactory('li', { child: [checkbox, span] });

    listItem.addEventListener("click", () => onClick(folder));
    return listItem;
}

/**
 * Creates a file/folder list item element for the main display.
 * @param {object} file - The file or folder object.
 * @param {function} onClick - The click handler function.
 * @returns {HTMLElement} - The list item element.
 */
function createFileFolderListItem(file, onClick) {
    let cbFileFolder = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-file-folder peer hidden",
        value: file.id
    });
    cbFileFolder.checked = file.checked;

    let spFileFolder = elemFactory('span', {
        "class": "flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto select-none \
                    peer-checked:bg-blue-500 peer-checked:text-white cursor-not-allowed \
                    hover:bg-gray-100 hover:overflow-visible",
    });

    const fileIcon = createFileIcon(file.type);
    if (fileIcon) {
        spFileFolder.appendChild(fileIcon);
        let sptextNode = document.createTextNode(file.name);
        spFileFolder.appendChild(sptextNode);
    } else {
        spFileFolder.classList.remove('cursor-not-allowed');
        spFileFolder.classList.add('cursor-pointer');
        // Use the utility to create character-wrapped filename
        spFileFolder.appendChild(createFileNameWithTooltips(file.name));
    }

    let liFileFolder = elemFactory('li', { child: [cbFileFolder, spFileFolder] });
    liFileFolder.addEventListener("click", () => onClick(file, cbFileFolder));
    return liFileFolder;
}

function showMainUI() {
    const appContainer = document.getElementById('app-container');
    const mainView = document.getElementById('main-view');
    const authorizeButton = document.getElementById('authorize');
    const authorizeContainer = document.getElementById('authorize-container');

    // Move button to the main view
    authorizeContainer.appendChild(authorizeButton);

    appContainer.classList.add('hidden');
    mainView.classList.remove('hidden');
}

function updateAuthorizeButton(isAuthSuccessful, isLoading) {
    const authorizeButton = document.getElementById('authorize');
    if (authorizeButton) {
        // Clear existing classes to apply new ones cleanly
        authorizeButton.className = ''; 
        authorizeButton.classList.add('px-2', 'py-1', 'text-sm', 'font-medium', 'text-white', 'bg-blue-700', 'rounded-lg', 'hover:bg-blue-800', 'focus:outline-none');

        if (isLoading) {
            // Loading state: hourglass animation
            authorizeButton.innerHTML = `<i class="fas fa-hourglass-half fa-spin"></i>`;
            authorizeButton.disabled = true;
            authorizeButton.classList.add('cursor-wait');
        } else {
            if (isAuthSuccessful) {
                // Success/Refresh state: simple refresh icon
                authorizeButton.title = 'Refresh';
                authorizeButton.innerHTML = `<i class="fas fa-sync-alt"></i>`;
            } else {
                // Initial Authorize state (if needed elsewhere, though usually hidden in main view)
                authorizeButton.textContent = 'Authorize';
            }
            authorizeButton.disabled = false;
            authorizeButton.classList.add('cursor-pointer');
        }
    }
}

function updateExecuteButtonVisibility() {
    const { arrListAllFiles } = getState();
    const nextStepBtn = document.getElementById('next-step-btn');
    const navExecuteBtn = document.getElementById('nav-execute');
    
    if (!nextStepBtn) return;

    const hasSelected = arrListAllFiles.some(file => file.checked);
    if (hasSelected) {
        nextStepBtn.classList.remove('hidden');
        if (navExecuteBtn) {
            navExecuteBtn.disabled = false;
        }
    } else {
        nextStepBtn.classList.add('hidden');
        if (navExecuteBtn) {
            navExecuteBtn.disabled = true;
        }
    }
}

function updateSelectionBlockVisibility(isVisible) {
    const selectionBlock = document.getElementById('selection-control-block');
    if (!selectionBlock) return;

    if (isVisible) {
        selectionBlock.classList.remove('hidden');
    } else {
        selectionBlock.classList.add('hidden');
    }
}

function renderEmptyFileList() {
    const container = elemFactory('div', {
        class: "flex flex-col items-center justify-center p-10 h-full text-gray-500 dark:text-gray-400"
    });

    const icon = elemFactory('i', {
        class: "fab fa-google-drive fa-3x"
    });

    container.appendChild(icon);

    return container;
}

function updateFileListBorderVisibility(isVisible) {
    const container = document.getElementById('file-list-container');
    if (!container) return;

    if (isVisible) {
        container.classList.add('border');
    } else {
        container.classList.remove('border');
    }
}

function updatePaginationVisibility(isVisible) {
    const pagination = document.getElementById('pagination-controls');
    if (!pagination) return;

    if (isVisible) {
        pagination.classList.remove('hidden');
    } else {
        pagination.classList.add('hidden');
    }
}

function updatePanelLayout() {
    const folders = document.getElementById('folders');
    const files = document.getElementById('files');
    const sidebar = document.getElementById('execute-sidebar');
    const navFolders = document.getElementById('nav-folders');
    const navExecute = document.getElementById('nav-execute');

    if (!folders || !files || !sidebar || !navFolders || !navExecute) return;

    const foldersVisible = !folders.classList.contains('hidden');
    const sidebarVisible = !sidebar.classList.contains('hidden');

    // Update Navbar styles for Folders button
    if (foldersVisible) {
        navFolders.classList.add('bg-gray-100', 'text-blue-700');
        navFolders.classList.remove('bg-white', 'text-gray-900');
    } else {
        navFolders.classList.remove('bg-gray-100', 'text-blue-700');
        navFolders.classList.add('bg-white', 'text-gray-900');
    }

    // Update Navbar styles for Execute button
    if (sidebarVisible) {
        navExecute.classList.add('bg-gray-100', 'text-blue-700');
        navExecute.classList.remove('bg-white', 'text-gray-900');
    } else {
        navExecute.classList.remove('bg-gray-100', 'text-blue-700');
        navExecute.classList.add('bg-white', 'text-gray-900');
    }

    // Update Grid layout
    files.classList.remove('col-span-12', 'col-span-8');
    if (foldersVisible || sidebarVisible) {
        files.classList.add('col-span-8');
    } else {
        files.classList.add('col-span-12');
    }
}

function setPanelVisibility(panel, isVisible) {
    const folders = document.getElementById('folders');
    const sidebar = document.getElementById('execute-sidebar');

    if (panel === 'folders') {
        if (isVisible) {
            folders.classList.remove('hidden');
            sidebar.classList.add('hidden'); // Mutually exclusive
        } else {
            folders.classList.add('hidden');
        }
    } else if (panel === 'execute-sidebar') {
        if (isVisible) {
            sidebar.classList.remove('hidden');
            folders.classList.add('hidden'); // Mutually exclusive
        } else {
            sidebar.classList.add('hidden');
        }
    }
    updatePanelLayout();
}

function toggleExecuteSidebar(isVisible) {
    setPanelVisibility('execute-sidebar', isVisible);
}

function updateSlicePreview(start, end) {
    const fileList = document.getElementById('file-folder-list');
    if (!fileList) return;

    const filenameWrappers = fileList.querySelectorAll('.filename-wrapper');
    filenameWrappers.forEach(wrapper => {
        const chars = wrapper.querySelectorAll('.char-span');
        chars.forEach((char, index) => {
            // Reset styles
            char.classList.remove('bg-blue-200', 'text-blue-800', 'border-l-2', 'border-blue-500', 'border-r-2');
            
            // Highlight range
            if (index >= start && index < end) {
                char.classList.add('bg-blue-200', 'text-blue-800');
            }

            // Cursor indicators
            if (index === parseInt(start)) {
                char.classList.add('border-l-2', 'border-blue-500');
            }
            if (index === parseInt(end)) {
                char.classList.add('border-l-2', 'border-red-500'); // Different color for end cursor? Or same?
                // Actually, end index is exclusive in slice usually, so cursor should be before the character at 'end' index
                // If end == length, we might need a way to show it at the very end.
            }
        });
    });
}

function renderSidebarForm(operationType) {
    const container = document.getElementById('sidebar-form-container');
    const runBtn = document.getElementById('run-sidebar-execute');
    if (!container || !runBtn) return;

    container.innerHTML = '';
    runBtn.classList.add('hidden');

    // Clear any existing previews when switching modes
    updateSlicePreview(-1, -1);

    if (operationType === 'replace') {
        const fromGroup = elemFactory('div', { class: 'mb-4' });
        fromGroup.appendChild(elemFactory('label', { for: 'sidebar-from', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'From' }));
        fromGroup.appendChild(elemFactory('input', { type: 'text', id: 'sidebar-from', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' }));

        const toGroup = elemFactory('div', { class: 'mb-4' });
        toGroup.appendChild(elemFactory('label', { for: 'sidebar-to', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'To' }));
        toGroup.appendChild(elemFactory('input', { type: 'text', id: 'sidebar-to', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' }));

        container.appendChild(fromGroup);
        container.appendChild(toGroup);
        runBtn.classList.remove('hidden');
    } else if (operationType === 'slice') {
        // Determine max length from visible files to set slider max
        // Ideally this should be dynamic per file, but for a global slider we might pick the max length of selected files
        // For now, let's set a reasonable default or try to find the max length
        let maxLen = 100;
        const { arrListAllFiles } = getState();
        if (arrListAllFiles && arrListAllFiles.length > 0) {
             maxLen = Math.max(...arrListAllFiles.filter(f => f.checked).map(f => f.name.length));
             if (maxLen === -Infinity) maxLen = 100; // Fallback if no checked files
        }

        // Start Position
        const startGroup = elemFactory('div', { class: 'mb-4' });
        startGroup.appendChild(elemFactory('label', { for: 'sidebar-start', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'Start Position' }));
        
        const startWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const startRange = elemFactory('input', { type: 'range', id: 'sidebar-start', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 0, max: maxLen, value: 0 });
        const startNumber = elemFactory('input', { type: 'number', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 0 });
        
        // End Position
        const endGroup = elemFactory('div', { class: 'mb-4' });
        endGroup.appendChild(elemFactory('label', { for: 'sidebar-end', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'End Position' }));
        
        const endWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const endRange = elemFactory('input', { type: 'range', id: 'sidebar-end', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 0, max: maxLen, value: 0 });
        const endNumber = elemFactory('input', { type: 'number', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 0 });

        const updateStart = () => {
            const startVal = parseInt(startRange.value);
            const endVal = parseInt(endRange.value);
            
            startNumber.value = startVal;
            
            // If start moves past end, push end forward
            if (startVal > endVal) {
                endRange.value = startVal;
                endNumber.value = startVal;
            }
            
            updateSlicePreview(startVal, parseInt(endRange.value));
        };

        const updateEnd = () => {
            const startVal = parseInt(startRange.value);
            const endVal = parseInt(endRange.value);
            
            // If end tries to go below start, clamp it to start
            if (endVal < startVal) {
                endRange.value = startVal;
                endNumber.value = startVal;
            } else {
                endNumber.value = endVal;
            }
            
            updateSlicePreview(startVal, parseInt(endRange.value));
        };

        startRange.addEventListener('input', updateStart);
        startNumber.addEventListener('input', () => { startRange.value = startNumber.value; updateStart(); });

        endRange.addEventListener('input', updateEnd);
        endNumber.addEventListener('input', () => { endRange.value = endNumber.value; updateEnd(); });

        startWrapper.appendChild(startRange);
        startWrapper.appendChild(startNumber);
        startGroup.appendChild(startWrapper);

        endWrapper.appendChild(endRange);
        endWrapper.appendChild(endNumber);
        endGroup.appendChild(endWrapper);

        container.appendChild(startGroup);
        container.appendChild(endGroup);
        runBtn.classList.remove('hidden');
    } else if (operationType === 'pad') {
        const lengthGroup = elemFactory('div', { class: 'mb-4' });
        lengthGroup.appendChild(elemFactory('label', { for: 'sidebar-pad-length', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'Expected Length' }));
        lengthGroup.appendChild(elemFactory('input', { type: 'number', id: 'sidebar-pad-length', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' }));

        container.appendChild(lengthGroup);
        runBtn.classList.remove('hidden');
    }
}


module.exports = {
    createFileIcon,
    createFolderListItem,
    createFileFolderListItem,
    showMainUI,
    updateAuthorizeButton,
    updateExecuteButtonVisibility,
    updateSelectionBlockVisibility,
    renderEmptyFileList,
    updateFileListBorderVisibility,
    updatePaginationVisibility,
    toggleExecuteSidebar,
    renderSidebarForm,
    setPanelVisibility,
    updatePanelLayout
};