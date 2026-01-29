// ui/helpers.js
function updateSelectionBlockVisibility(isVisible) {
    const selectionBlock = document.getElementById('selection-control-block');
    if (!selectionBlock) return;

    if (isVisible) {
        selectionBlock.classList.remove('hidden');
    } else {
        selectionBlock.classList.add('hidden');
    }
}

function updateFileListBorderVisibility(isVisible) {
    const container = document.getElementById('file-list-container');
    if (!container) return;

    if (isVisible) {
        container.classList.remove('border');
        container.classList.add('shadow-sm', 'rounded-lg');
    } else {
        container.classList.remove('border', 'shadow-sm', 'rounded-lg');
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

    const listItems = fileList.querySelectorAll('li');

    listItems.forEach(li => {
        const checkbox = li.querySelector('.cbox-file-folder');
        const wrapper = li.querySelector('.filename-wrapper');

        if (!checkbox || !wrapper) return;

        const chars = wrapper.querySelectorAll('.char-span');
        
        // First, clear any existing styles from this item
        chars.forEach((char) => {
            char.classList.remove('bg-blue-200', 'text-blue-800', 'border-l-2', 'border-blue-500', 'border-r-2', 'border-red-500');
        });

        // Apply new styles only if the checkbox is checked
        if (checkbox.checked) {
            chars.forEach((char, index) => {
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
        }
    });
}

module.exports = {
    updateSelectionBlockVisibility,
    updateFileListBorderVisibility,
    updatePaginationVisibility,
    updateSlicePreview
};
