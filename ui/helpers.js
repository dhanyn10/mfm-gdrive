// ui/helpers.js

/**
 * Shows or hides the block containing selection controls (e.g., "Select All", "Select None").
 * @param {boolean} isVisible - True to show the block, false to hide it.
 */
function updateSelectionBlockVisibility(isVisible) {
    const selectionBlock = document.getElementById('selection-control-block');
    if (!selectionBlock) return;

    if (isVisible) {
        selectionBlock.classList.remove('hidden');
    } else {
        selectionBlock.classList.add('hidden');
    }
}

/**
 * Updates the border and shadow visibility for the file list container.
 * This is used to remove the border when the list is empty.
 * @param {boolean} isVisible - True to add styling (shadow, rounded corners), false to remove it.
 */
function updateFileListBorderVisibility(isVisible) {
    const container = document.getElementById('file-list-container');
    if (!container) return;

    if (isVisible) {
        // When visible, it has a shadow and rounded corners but no explicit border.
        container.classList.remove('border'); // This seems to be removing a class that might not be there.
        container.classList.add('shadow-sm', 'rounded-lg');
    } else {
        // When hidden/empty, all decorative styles are removed.
        container.classList.remove('border', 'shadow-sm', 'rounded-lg');
    }
}

/**
 * Shows or hides the pagination controls.
 * @param {boolean} isVisible - True to show the controls, false to hide them.
 */
function updatePaginationVisibility(isVisible) {
    const pagination = document.getElementById('pagination-controls');
    if (!pagination) return;

    if (isVisible) {
        pagination.classList.remove('hidden');
    } else {
        pagination.classList.add('hidden');
    }
}

/**
 * Updates the visual preview for the 'slice' operation on all selected file items.
 * It highlights the characters that will be removed.
 * @param {number} start - The starting index of the slice.
 * @param {number} end - The ending index of the slice.
 */
function updateSlicePreview(start, end) {
    const fileList = document.getElementById('file-folder-list');
    if (!fileList) return;

    const listItems = fileList.querySelectorAll('li');

    listItems.forEach(li => {
        const checkbox = li.querySelector('.cbox-file-folder');
        const wrapper = li.querySelector('.filename-wrapper');

        if (!checkbox || !wrapper) return;

        const chars = wrapper.querySelectorAll('.char-span');
        
        // First, clear any existing slice-related styles from this item.
        chars.forEach((char) => {
            char.classList.remove('bg-blue-200', 'text-blue-800', 'border-l-2', 'border-blue-500', 'border-r-2', 'border-red-500');
        });

        // Apply new styles only if the item's checkbox is checked.
        if (checkbox.checked) {
            chars.forEach((char, index) => {
                // Highlight the characters that are part of the slice to be kept.
                if (index >= start && index < end) {
                    char.classList.add('bg-blue-200', 'text-blue-800');
                }

                // Add a border to indicate the start and end points of the slice.
                if (index === parseInt(start)) {
                    char.classList.add('border-l-2', 'border-blue-500');
                }
                if (index === parseInt(end)) {
                    // Note: This should likely be `border-r-2` or applied to the previous character
                    // to correctly visualize the slice from `start` up to (but not including) `end`.
                    char.classList.add('border-l-2', 'border-red-500');
                }
            });
        }
    });
}

module.exports = {
    updateSelectionBlockVisibility,
    updateFileListBorderVisibility,
    updatePaginationVisibility,
    updateSlicePreview
};
