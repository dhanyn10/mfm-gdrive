// ui/components.js
const { elemFactory, createFileNameWithTooltips, padFilename } = require('../utils');
const { getState } = require('../state');
const { updateSlicePreview } = require('./helpers');

/**
 * Creates a folder icon element if the file type matches the folder MIME type.
 * @param {string} fileType - The MIME type of the file.
 * @returns {HTMLElement|null} A span element containing a folder icon, or null.
 */
function createFileIcon(fileType) {
    const { mime } = getState();
    if (fileType === mime) {
        const folderIconSpan = document.createElement('span');
        folderIconSpan.className = "float-left pr-2";
        folderIconSpan.innerHTML = `<i class="fas fa-folder w-5 h-5"></i>`;
        return folderIconSpan;
    }
    return null;
}

/**
 * Creates a list item element for a folder.
 * @param {object} folder - The folder object, containing id and name.
 * @param {function} onClick - The callback function to execute when the item is clicked.
 * @returns {HTMLElement} A list item (`<li>`) element for the folder.
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
 * Creates a list item element for a file, including checkbox, name, and preview functionality.
 * @param {object} file - The file object, containing id, name, type, and checked status.
 * @param {function} onClick - The callback function to execute when the item is clicked.
 * @returns {HTMLElement} A list item (`<li>`) element for the file.
 */
function createFileFolderListItem(file, onClick) {
    let fileFolderCheckbox = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-file-folder peer hidden",
        value: file.id
    });
    fileFolderCheckbox.checked = file.checked;

    let fileFolderSpan = elemFactory('span', {
        "class": "flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto select-none \
                    peer-checked:bg-blue-500 peer-checked:text-white \
                    hover:bg-gray-100 peer-checked:hover:bg-blue-500 peer-checked:hover:text-white hover:overflow-visible",
    });

    const fileIcon = createFileIcon(file.type);
    if (fileIcon) {
        // This branch is for items that are folders (based on MIME type).
        fileFolderSpan.appendChild(fileIcon);
        let fileNameTextNode = document.createTextNode(file.name);
        fileFolderSpan.appendChild(fileNameTextNode);
    } else {
        // This branch is for files, adding preview functionality.
        fileFolderSpan.classList.remove('cursor-not-allowed');
        fileFolderSpan.classList.add('cursor-pointer');
        
        const nameWrapper = elemFactory('div', { class: 'flex flex-col w-full' });
        const topRow = elemFactory('div', { class: 'flex justify-between items-center' });
        topRow.appendChild(createFileNameWithTooltips(file.name));
        
        const previewButton = elemFactory('button', {
            class: 'text-xs text-gray-400 hover:text-gray-600 ml-2 preview-toggle-button hidden',
            innerHTML: 'Preview'
        });
        topRow.appendChild(previewButton);
        nameWrapper.appendChild(topRow);
        
        const previewDiv = elemFactory('div', { 
            class: 'text-xs text-gray-500 mt-1 hidden preview-change',
            innerHTML: '' 
        });
        nameWrapper.appendChild(previewDiv);
        fileFolderSpan.appendChild(nameWrapper);

        previewButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the li's click handler from firing.
            const isExpanded = previewDiv.classList.toggle('expanded');
            previewButton.innerHTML = isExpanded ? 'Hide' : 'Preview';
            
            // Re-render the sidebar form to update the detailed preview.
            const currentOperation = document.querySelector('input[name="operation"]:checked');
            if (currentOperation) {
                renderSidebarForm(currentOperation.value);
            }
        });
    }

    let fileFolderListItem = elemFactory('li', { child: [fileFolderCheckbox, fileFolderSpan] });
    fileFolderListItem.addEventListener("click", () => onClick(file, fileFolderCheckbox));
    return fileFolderListItem;
}

/**
 * Renders a placeholder element to display when the file list is empty.
 * @returns {HTMLElement} A div element with a Google Drive icon.
 */
function renderEmptyFileList() {
    const container = elemFactory('div', {
        class: "flex flex-col items-center justify-center p-10 h-full text-gray-500 dark:text-gray-400"
    });
    const icon = elemFactory('i', { class: "fab fa-google-drive fa-3x" });
    container.appendChild(icon);
    return container;
}

/**
 * Renders a loading indicator element to display while files are being fetched.
 * @returns {HTMLElement} A div element with a spinning spinner icon.
 */
function renderLoadingIndicator() {
    const container = elemFactory('div', {
        class: "flex flex-col items-center justify-center p-10 h-full text-gray-500 dark:text-gray-400"
    });
    const icon = elemFactory('i', { class: "fas fa-spinner fa-spin fa-3x" });
    container.appendChild(icon);
    return container;
}

/**
 * Resets the visual styles of all file list items to their default state.
 * This is typically called when the sidebar is closed or the panel is changed.
 */
function resetFileListItemStyles() {
    const fileList = document.getElementById('file-folder-list');
    if (!fileList) return;

    const listItems = fileList.querySelectorAll('li');
    listItems.forEach(li => {
        const fileFolderSpan = li.querySelector('span:first-of-type');
        if (fileFolderSpan) {
            // Remove preview-specific styles
            fileFolderSpan.classList.remove('peer-checked:bg-transparent', 'peer-checked:text-gray-900');
            // Ensure default selection styles are present
            fileFolderSpan.classList.add('peer-checked:bg-blue-500', 'peer-checked:text-white');
        }
        
        // Hide and clear all preview elements.
        const previewDiv = li.querySelector('.preview-change');
        if (previewDiv) {
            previewDiv.classList.add('hidden');
            previewDiv.innerHTML = '';
            previewDiv.classList.remove('expanded');
        }
        const previewButton = li.querySelector('.preview-toggle-button');
        if (previewButton) {
            previewButton.classList.add('hidden');
            previewButton.innerHTML = 'Preview';
        }
    });
}

/**
 * Resets the sidebar form to its default state.
 * Clears input fields and resets the operation dropdown.
 */
function resetSidebarForm() {
    const container = document.getElementById('sidebar-form-container');
    if (container) {
        container.innerHTML = '';
    }

    const runButton = document.getElementById('run-sidebar-execute');
    if (runButton) {
        runButton.classList.add('hidden');
    }

    const operationSelect = document.getElementById('operation-select');
    const dropdownButton = document.getElementById('dropdown-button');
    if (operationSelect && dropdownButton) {
        operationSelect.value = '';
        dropdownButton.innerHTML = `Select Operation <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/></svg>`;
    }
}

/**
 * Renders the appropriate form inside the sidebar based on the selected operation type.
 * @param {string} operationType - The type of operation (e.g., 'replace', 'slice', 'pad').
 */
function renderSidebarForm(operationType) {
    const container = document.getElementById('sidebar-form-container');
    const runButton = document.getElementById('run-sidebar-execute');
    if (!container || !runButton) return;

    container.innerHTML = '';
    runButton.classList.add('hidden');

    // If no operation is selected (e.g., sidebar is closing), reset styles and exit.
    if (!operationType) {
        resetFileListItemStyles();
        return;
    }

    // Clear slice preview highlights if the operation is not 'slice'.
    if (operationType !== 'slice') {
        updateSlicePreview(-1, -1);
    }

    /**
     * Updates the inline preview for each selected file item.
     * @param {function(string): string} transformer - A function that takes the original name and returns the new name.
     */
    const updateInlinePreviews = (transformer) => {
        const fileList = document.getElementById('file-folder-list');
        if (!fileList) return;
        
        const listItems = fileList.querySelectorAll('li');
        listItems.forEach(li => {
            const checkbox = li.querySelector('.cbox-file-folder');
            const previewDiv = li.querySelector('.preview-change');
            const nameWrapper = li.querySelector('.filename-wrapper');
            const previewButton = li.querySelector('.preview-toggle-button');
            const fileFolderSpan = li.querySelector('span:first-of-type');

            if (!fileFolderSpan) return;

            // First, ensure the item is in the default state.
            fileFolderSpan.classList.remove('peer-checked:bg-transparent', 'peer-checked:text-gray-900');
            fileFolderSpan.classList.add('peer-checked:bg-blue-500', 'peer-checked:text-white');

            if (checkbox && checkbox.checked && previewDiv && nameWrapper && previewButton) {
                const originalName = nameWrapper.textContent;
                const newName = transformer(originalName);
                
                // If the name changes, apply the preview styling.
                if (newName !== originalName) {
                    // Remove default styles and add preview styles.
                    fileFolderSpan.classList.remove('peer-checked:bg-blue-500', 'peer-checked:text-white');
                    fileFolderSpan.classList.add('peer-checked:bg-transparent', 'peer-checked:text-gray-900');
                    
                    previewButton.classList.remove('hidden');
                    previewDiv.classList.remove('hidden');

                    // Show detailed before/after if expanded.
                    if (previewDiv.classList.contains('expanded')) {
                        previewDiv.innerHTML = `
                            <div class="font-semibold text-gray-500">Before:</div>
                            <div class="ml-2 mb-1 text-gray-500">${originalName}</div>
                            <div class="font-semibold text-gray-500">After:</div>
                            <div class="ml-2 text-green-600">${newName}</div>
                        `;
                    } else {
                        previewDiv.innerHTML = `<i class="fas fa-arrow-right mr-1"></i> <span class="text-green-600">${newName}</span>`;
                    }
                } else {
                    // If no change, hide the preview elements. The default style is already applied.
                    previewDiv.classList.add('hidden');
                    previewButton.classList.add('hidden');
                    previewDiv.classList.remove('expanded');
                    previewButton.innerHTML = 'Preview';
                }
            } else if (previewDiv) {
                // Hide previews for non-selected items.
                previewDiv.classList.add('hidden');
                if(previewButton) previewButton.classList.add('hidden');
            }
        });
    };

    // Dynamically create and append form elements based on operationType.
    if (operationType === 'replace') {
        const fromGroupContainer = elemFactory('div', { class: 'mb-4' });
        fromGroupContainer.appendChild(elemFactory('label', { for: 'sidebar-from', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'From' }));
        const fromInput = elemFactory('input', { type: 'text', id: 'sidebar-from', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' });
        fromGroupContainer.appendChild(fromInput);

        const toGroupContainer = elemFactory('div', { class: 'mb-4' });
        toGroupContainer.appendChild(elemFactory('label', { for: 'sidebar-to', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'To' }));
        const toInput = elemFactory('input', { type: 'text', id: 'sidebar-to', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' });
        toGroupContainer.appendChild(toInput);
        
        container.appendChild(fromGroupContainer);
        container.appendChild(toGroupContainer);
        runButton.classList.remove('hidden');

        const updatePreview = () => {
            const fromValue = fromInput.value;
            const toValue = toInput.value;
            updateInlinePreviews((name) => fromValue ? name.replace(new RegExp(fromValue, 'g'), toValue) : name);
        };

        fromInput.addEventListener('input', updatePreview);
        toInput.addEventListener('input', updatePreview);
        updatePreview(); // Initial call.

    } else if (operationType === 'slice') {
        let maxLength = 100;
        const { arrListAllFiles } = getState();
        if (arrListAllFiles && arrListAllFiles.length > 0) {
             const checkedFiles = arrListAllFiles.filter(f => f.checked);
             if (checkedFiles.length > 0) {
                 maxLength = Math.max(...checkedFiles.map(f => f.name.length));
             }
        }

        const startGroupContainer = elemFactory('div', { class: 'mb-4' });
        startGroupContainer.appendChild(elemFactory('label', { for: 'sidebar-start', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'Start Position' }));
        const startInputWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const startRangeSlider = elemFactory('input', { type: 'range', id: 'sidebar-start', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 0, max: maxLength, value: 0 });
        const startNumberInput = elemFactory('input', { type: 'number', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 0 });
        
        const endGroupContainer = elemFactory('div', { class: 'mb-4' });
        endGroupContainer.appendChild(elemFactory('label', { for: 'sidebar-end', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'End Position' }));
        const endInputWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const endRangeSlider = elemFactory('input', { type: 'range', id: 'sidebar-end', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 0, max: maxLength, value: 0 });
        const endNumberInput = elemFactory('input', { type: 'number', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 0 });

        const sliceTransformer = (name) => {
            const s = parseInt(startRangeSlider.value);
            const e = parseInt(endRangeSlider.value);
            if (s >= e) return name;
            return name.slice(0, s) + name.slice(e);
        };

        const updateStart = () => {
            const startValue = parseInt(startRangeSlider.value);
            const endValue = parseInt(endRangeSlider.value);
            startNumberInput.value = startValue;
            if (startValue > endValue) {
                endRangeSlider.value = startValue;
                endNumberInput.value = startValue;
            }
            updateSlicePreview(startValue, parseInt(endRangeSlider.value));
            updateInlinePreviews(sliceTransformer);
        };

        const updateEnd = () => {
            const startValue = parseInt(startRangeSlider.value);
            const endValue = parseInt(endRangeSlider.value);
            if (endValue < startValue) {
                endRangeSlider.value = startValue;
                endNumberInput.value = startValue;
            } else {
                endNumberInput.value = endValue;
            }
            updateSlicePreview(startValue, parseInt(endRangeSlider.value));
            updateInlinePreviews(sliceTransformer);
        };

        startRangeSlider.addEventListener('input', updateStart);
        startNumberInput.addEventListener('input', () => { startRangeSlider.value = startNumberInput.value; updateStart(); });
        endRangeSlider.addEventListener('input', updateEnd);
        endNumberInput.addEventListener('input', () => { endRangeSlider.value = endNumberInput.value; updateEnd(); });

        startInputWrapper.appendChild(startRangeSlider);
        startInputWrapper.appendChild(startNumberInput);
        startGroupContainer.appendChild(startInputWrapper);
        endInputWrapper.appendChild(endRangeSlider);
        endInputWrapper.appendChild(endNumberInput);
        endGroupContainer.appendChild(endInputWrapper);

        container.appendChild(startGroupContainer);
        container.appendChild(endGroupContainer);
        runButton.classList.remove('hidden');

    } else if (operationType === 'pad') {
        const lengthGroupContainer = elemFactory('div', { class: 'mb-4' });
        lengthGroupContainer.appendChild(elemFactory('label', { for: 'sidebar-pad-length', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'Expected Length' }));
        const lengthInputWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const lengthRangeSlider = elemFactory('input', { type: 'range', id: 'sidebar-pad-length-range', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 1, max: 10, value: 1 });
        const lengthNumberInput = elemFactory('input', { type: 'number', id: 'sidebar-pad-length', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 1 });
        
        lengthInputWrapper.appendChild(lengthRangeSlider);
        lengthInputWrapper.appendChild(lengthNumberInput);
        lengthGroupContainer.appendChild(lengthInputWrapper);
        container.appendChild(lengthGroupContainer);
        runButton.classList.remove('hidden');

        const updatePreview = () => {
            const paddingLength = lengthNumberInput.value;
            updateInlinePreviews((name) => paddingLength ? padFilename(name, paddingLength) : name);
        };

        lengthRangeSlider.addEventListener('input', () => { lengthNumberInput.value = lengthRangeSlider.value; updatePreview(); });
        lengthNumberInput.addEventListener('input', () => { lengthRangeSlider.value = lengthNumberInput.value; updatePreview(); });
        updatePreview(); // Initial call.
    }
}

module.exports = {
    createFileIcon,
    createFolderListItem,
    createFileFolderListItem,
    renderEmptyFileList,
    renderLoadingIndicator,
    renderSidebarForm,
    resetFileListItemStyles,
    resetSidebarForm
};
