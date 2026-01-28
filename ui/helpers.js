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

module.exports = {
    updateSelectionBlockVisibility,
    updateFileListBorderVisibility,
    updatePaginationVisibility,
    updateSlicePreview
};
