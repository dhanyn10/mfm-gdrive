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
        authorizeButton.classList.add('flex', 'items-center', 'gap-2');
        if (isLoading) {
            authorizeButton.innerHTML = isAuthSuccessful 
                ? `<i class="fas fa-spinner fa-spin"></i> Refreshing...` 
                : 'Loading...';
            authorizeButton.disabled = true;
        } else {
            if (isAuthSuccessful) {
                authorizeButton.title = 'Refresh';
                authorizeButton.innerHTML = `<i class="fas fa-sync-alt"></i>`;
            } else {
                authorizeButton.textContent = 'Authorize';
            }
            authorizeButton.disabled = false;
        }
    }
}

function updateExecuteButtonVisibility() {
    const { arrListAllFiles } = getState();
    const executeBtn = document.getElementById('execute-btn');
    if (!executeBtn) return;

    const hasSelected = arrListAllFiles.some(file => file.checked);
    if (hasSelected) {
        executeBtn.classList.remove('hidden');
    } else {
        executeBtn.classList.add('hidden');
    }
}


module.exports = {
    createFileIcon,
    createFolderListItem,
    createFileFolderListItem,
    showMainUI,
    updateAuthorizeButton,
    updateExecuteButtonVisibility
};