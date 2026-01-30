// ui/components.js
const { elemFactory, createFileNameWithTooltips, padFilename } = require('../utils');
const { getState } = require('../state');
const { updateSlicePreview } = require('./helpers');

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

function createFileFolderListItem(file, onClick) {
    let cbFileFolder = elemFactory('input', {
        type: "checkbox",
        "class": "cbox-file-folder peer hidden",
        value: file.id
    });
    cbFileFolder.checked = file.checked;

    let spFileFolder = elemFactory('span', {
        "class": "flex items-center px-4 py-2 border-b border-gray-200 overflow-x-auto select-none \
                    peer-checked:bg-blue-500 peer-checked:text-white \
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
        
        spFileFolder.appendChild(nameWrapper);

        previewButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = previewDiv.classList.toggle('expanded');
            previewButton.innerHTML = isExpanded ? 'Hide' : 'Preview';
            
            const currentOperation = document.querySelector('input[name="operation"]:checked');
            if (currentOperation) {
                renderSidebarForm(currentOperation.value);
            }
        });
    }

    let liFileFolder = elemFactory('li', { child: [cbFileFolder, spFileFolder] });
    liFileFolder.addEventListener("click", () => onClick(file, cbFileFolder));
    return liFileFolder;
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

function renderLoadingIndicator() {
    const container = elemFactory('div', {
        class: "flex flex-col items-center justify-center p-10 h-full text-gray-500 dark:text-gray-400"
    });

    const icon = elemFactory('i', {
        class: "fas fa-spinner fa-spin fa-3x"
    });

    container.appendChild(icon);

    return container;
}

/**
 * Mengembalikan semua item file ke Tampilan 1 (status seleksi default).
 * Panggil fungsi ini saat sidebar ditutup.
 */
function resetFileListItemStyles() {
    const fileList = document.getElementById('file-folder-list');
    if (!fileList) return;

    const listItems = fileList.querySelectorAll('li');
    listItems.forEach(li => {
        const spFileFolder = li.querySelector('span:first-of-type');
        if (spFileFolder) {
            // Hapus kelas Tampilan 2 untuk memastikan Tampilan 1 (peer-checked) aktif.
            spFileFolder.classList.remove('bg-transparent', 'text-red-600');
        }
        
        // Sembunyikan dan bersihkan semua elemen pratinjau.
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

function renderSidebarForm(operationType) {
    const container = document.getElementById('sidebar-form-container');
    const runBtn = document.getElementById('run-sidebar-execute');
    if (!container || !runBtn) return;

    container.innerHTML = '';
    runBtn.classList.add('hidden');

    // Jika sidebar ditutup, panggil fungsi reset.
    if (!operationType) {
        resetFileListItemStyles();
        return;
    }

    if (operationType !== 'slice') {
        updateSlicePreview(-1, -1);
    }

    const updateInlinePreviews = (transformer) => {
        const fileList = document.getElementById('file-folder-list');
        if (!fileList) return;
        
        const listItems = fileList.querySelectorAll('li');
        listItems.forEach(li => {
            const checkbox = li.querySelector('.cbox-file-folder');
            const previewDiv = li.querySelector('.preview-change');
            const nameWrapper = li.querySelector('.filename-wrapper');
            const previewButton = li.querySelector('.preview-toggle-button');
            const spFileFolder = li.querySelector('span:first-of-type');

            if (!spFileFolder) return;

            // Selalu reset dengan menghapus kelas Tampilan 2 di awal.
            spFileFolder.classList.remove('bg-transparent', 'text-red-600');

            if (checkbox && checkbox.checked && previewDiv && nameWrapper && previewButton) {
                const originalName = nameWrapper.textContent;
                const newName = transformer(originalName);
                
                // Jika ada perubahan, terapkan Tampilan 2.
                if (newName !== originalName) {
                    spFileFolder.classList.add('bg-transparent', 'text-red-600');

                    previewButton.classList.remove('hidden');
                    previewDiv.classList.remove('hidden');

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
                    // Jika tidak ada perubahan, Tampilan 1 (peer-checked) akan otomatis aktif.
                    previewDiv.classList.add('hidden');
                    previewButton.classList.add('hidden');
                    previewDiv.classList.remove('expanded');
                    previewButton.innerHTML = 'Preview';
                }
            } else if (previewDiv) {
                previewDiv.classList.add('hidden');
                if(previewButton) previewButton.classList.add('hidden');
            }
        });
    };

    if (operationType === 'replace') {
        const fromGroup = elemFactory('div', { class: 'mb-4' });
        fromGroup.appendChild(elemFactory('label', { for: 'sidebar-from', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'From' }));
        const fromInput = elemFactory('input', { type: 'text', id: 'sidebar-from', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' });
        fromGroup.appendChild(fromInput);

        const toGroup = elemFactory('div', { class: 'mb-4' });
        toGroup.appendChild(elemFactory('label', { for: 'sidebar-to', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'To' }));
        const toInput = elemFactory('input', { type: 'text', id: 'sidebar-to', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white' });
        toGroup.appendChild(toInput);
        
        container.appendChild(fromGroup);
        container.appendChild(toGroup);
        runBtn.classList.remove('hidden');

        const updatePreview = () => {
            const fromValue = fromInput.value;
            const toValue = toInput.value;
            
            updateInlinePreviews((name) => {
                return fromValue ? name.replace(new RegExp(fromValue, 'g'), toValue) : name;
            });
        };

        fromInput.addEventListener('input', updatePreview);
        toInput.addEventListener('input', updatePreview);
        updatePreview();

    } else if (operationType === 'slice') {
        let maxLen = 100;
        const { arrListAllFiles } = getState();
        if (arrListAllFiles && arrListAllFiles.length > 0) {
             maxLen = Math.max(...arrListAllFiles.filter(f => f.checked).map(f => f.name.length));
             if (maxLen === -Infinity) maxLen = 100;
        }

        const startGroup = elemFactory('div', { class: 'mb-4' });
        startGroup.appendChild(elemFactory('label', { for: 'sidebar-start', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'Start Position' }));
        
        const startWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const startRange = elemFactory('input', { type: 'range', id: 'sidebar-start', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 0, max: maxLen, value: 0 });
        const startNumber = elemFactory('input', { type: 'number', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 0 });
        
        const endGroup = elemFactory('div', { class: 'mb-4' });
        endGroup.appendChild(elemFactory('label', { for: 'sidebar-end', class: 'block mb-2 text-sm font-medium text-gray-900 dark:text-white', innerHTML: 'End Position' }));
        
        const endWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const endRange = elemFactory('input', { type: 'range', id: 'sidebar-end', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 0, max: maxLen, value: 0 });
        const endNumber = elemFactory('input', { type: 'number', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 0 });

        const updateStart = () => {
            const startVal = parseInt(startRange.value);
            const endVal = parseInt(endRange.value);
            
            startNumber.value = startVal;
            
            if (startVal > endVal) {
                endRange.value = startVal;
                endNumber.value = startVal;
            }
            
            updateSlicePreview(startVal, parseInt(endRange.value));
            
            updateInlinePreviews((name) => {
                const s = parseInt(startRange.value);
                const e = parseInt(endRange.value);
                if (s >= e) return name;
                return name.slice(0, s) + name.slice(e);
            });
        };

        const updateEnd = () => {
            const startVal = parseInt(startRange.value);
            const endVal = parseInt(endRange.value);
            
            if (endVal < startVal) {
                endRange.value = startVal;
                endNumber.value = startVal;
            } else {
                endNumber.value = endVal;
            }
            
            updateSlicePreview(startVal, parseInt(endRange.value));
            
            updateInlinePreviews((name) => {
                const s = parseInt(startRange.value);
                const e = parseInt(endRange.value);
                if (s >= e) return name;
                return name.slice(0, s) + name.slice(e);
            });
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
        
        const lengthWrapper = elemFactory('div', { class: 'flex items-center gap-2' });
        const lengthRange = elemFactory('input', { type: 'range', id: 'sidebar-pad-length-range', class: 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700', min: 1, max: 10, value: 1 });
        const lengthNumber = elemFactory('input', { type: 'number', id: 'sidebar-pad-length', class: 'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white', value: 1 });
        
        lengthWrapper.appendChild(lengthRange);
        lengthWrapper.appendChild(lengthNumber);
        lengthGroup.appendChild(lengthWrapper);

        container.appendChild(lengthGroup);
        runBtn.classList.remove('hidden');

        const updatePreview = () => {
            const padLength = lengthNumber.value;
            
            updateInlinePreviews((name) => {
                return padLength ? padFilename(name, padLength) : name;
            });
        };

        lengthRange.addEventListener('input', () => {
            lengthNumber.value = lengthRange.value;
            updatePreview();
        });
        lengthNumber.addEventListener('input', () => {
            lengthRange.value = lengthNumber.value;
            updatePreview();
        });
        updatePreview();
    }
}

module.exports = {
    createFileIcon,
    createFolderListItem,
    createFileFolderListItem,
    renderEmptyFileList,
    renderLoadingIndicator,
    renderSidebarForm,
    resetFileListItemStyles
};
