// ui/helpers.js
const { getState } = require('../state');

function updateSelectionBlockVisibility(isVisible) {
    const selectionBlock = document.getElementById('selection-control-block');
    if (!selectionBlock) return;

    if (isVisible) {
        selectionBlock.classList.remove('hidden');
    } else {
        selectionBlock.classList.add('hidden');
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

function updateSlicePreview(start, end) {
    const fileList = document.getElementById('file-folder-list');
    if (!fileList) return;

    const filenameWrappers = fileList.querySelectorAll('.filename-wrapper');
    filenameWrappers.forEach(wrapper => {
        const chars = wrapper.querySelectorAll('.char-span');
        chars.forEach((char, index) => {
            char.classList.remove('bg-blue-200', 'text-blue-800', 'border-l-2', 'border-blue-500', 'border-r-2');
            
            if (index >= start && index < end) {
                char.classList.add('bg-blue-200', 'text-blue-800');
            }

            if (index === parseInt(start)) {
                char.classList.add('border-l-2', 'border-blue-500');
            }
            if (index === parseInt(end)) {
                char.classList.add('border-l-2', 'border-red-500');
            }
        });
    });
}

function updateFileListItemStyles() {
    const { currentFileList } = getState();
    const fileListContainer = document.getElementById('file-folder-list');
    if (!fileListContainer) return;

    const listItems = fileListContainer.querySelectorAll('li');
    const isSelectionActive = currentFileList.some(file => file.checked);

    listItems.forEach((li, index) => {
        const file = currentFileList[index];
        if (!file) return; // Skip items like the "up" folder button
        const span = li.querySelector('span');
        if (!span) return;

        // All files are always interactive.
        span.classList.add('cursor-pointer', 'hover:bg-gray-100');
        span.classList.remove('cursor-not-allowed');

        // The only thing that changes is opacity.
        // If a selection is active and this item is NOT selected, dim it.
        if (isSelectionActive && !file.checked) {
            span.classList.add('opacity-50');
        } else {
            // Otherwise (no selection, or this item is selected), it's full opacity.
            span.classList.remove('opacity-50');
        }
    });
}

module.exports = {
    updateSelectionBlockVisibility,
    updatePaginationVisibility,
    updateSlicePreview,
    updateFileListItemStyles
};
