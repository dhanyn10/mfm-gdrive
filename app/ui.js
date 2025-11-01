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
        spFolderIcon.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
            </svg>`;
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
    document.getElementById("mfm-opt").classList.remove("invisible");
    document.getElementById("folders").classList.remove("invisible");
    document.getElementById("files").classList.remove("invisible");
    document.getElementById("mfm-play").classList.remove("invisible");
    document.getElementById("pagination-controls").classList.remove("invisible");
}

function updateAuthorizeButton(isAuthSuccessful, isLoading) {
    const authorizeButton = document.getElementById('authorize');
    if (authorizeButton) {
        if (isLoading) {
            authorizeButton.textContent = isAuthSuccessful ? 'Refreshing...' : 'Loading...';
            authorizeButton.disabled = true;
        } else {
            authorizeButton.textContent = isAuthSuccessful ? 'Refresh' : 'Authorize';
            authorizeButton.disabled = false;
        }
    }
}


module.exports = {
    createFileIcon,
    createFolderListItem,
    createFileFolderListItem,
    showMainUI,
    updateAuthorizeButton
};