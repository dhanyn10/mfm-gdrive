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
    const { currentFileList } = getState();
    const fileListContainer = document.getElementById('file-folder-list');
    if (!fileListContainer) return;

    const listItems = fileListContainer.querySelectorAll('li');

    listItems.forEach((li, itemIndex) => {
        const file = currentFileList[itemIndex];
        if (!file) return; // Skip if no corresponding file data

        const wrapper = li.querySelector('.filename-wrapper');
        if (!wrapper) return; // Skip if not a file item

        const chars = wrapper.querySelectorAll('.char-span');
        const isChecked = file.checked;

        chars.forEach((char, charIndex) => {
            // Always remove previous styling first
            char.classList.remove('bg-blue-200', 'text-blue-800', 'border-l-2', 'border-blue-500', 'border-r-2');

            // Apply new styling only if the item is checked
            if (isChecked) {
                if (charIndex >= start && charIndex < end) {
                    char.classList.add('bg-blue-200', 'text-blue-800');
                }
                if (charIndex === parseInt(start)) {
                    char.classList.add('border-l-2', 'border-blue-500');
                }
                if (charIndex === parseInt(end)) {
                    char.classList.add('border-l-2', 'border-red-500');
                }
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
        if (!file) return;
        const span = li.querySelector('span');
        if (!span) return;

        // Ensure interactivity is always on
        span.classList.add('cursor-pointer', 'hover:bg-gray-100');
        span.classList.remove('cursor-not-allowed', 'opacity-50');

        // If a selection is active and this item is NOT selected, dim its background.
        if (isSelectionActive && !file.checked) {
            span.classList.add('bg-gray-50');
        } else {
            // Otherwise (no selection, or this item is selected), it has a transparent background.
            span.classList.remove('bg-gray-50');
        }
    });
}

module.exports = {
    updateSelectionBlockVisibility,
    updatePaginationVisibility,
    updateSlicePreview,
    updateFileListItemStyles
};
