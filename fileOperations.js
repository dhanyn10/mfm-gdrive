
const { showToast, padFilename } = require('./utils');
const { renameFile } = require('./driveApi');
const { getCheckedFiles } = require('./state');
const { showReplaceTextModal, showSliceTextModal, showPadFilenameModal } = require('./flowbite-helpers');

/**
 * Handles the "Replace Text" operation.
 */
function handleReplaceText(driveClient, refreshFileList) {
    showReplaceTextModal(async (from, to) => {
        const checkedFiles = getCheckedFiles();
        const renamePromises = checkedFiles.map(file => {
            const newFilename = file.name.replace(new RegExp(from, 'g'), to);
            return renameFile(driveClient, file.id, newFilename, file.name);
        });

        try {
            await Promise.all(renamePromises);
            refreshFileList();
        } catch (error) {
            showToast('An error occurred during rename.', 'error');
            console.error('Error during rename:', error);
        }
    });
}

/**
 * Handles the "Slice Text" operation.
 */
function handleSliceText(driveClient, refreshFileList) {
    showSliceTextModal(async (start, end) => {
        const startNum = parseInt(start);
        const endNum = parseInt(end);

        if (isNaN(startNum) || startNum < 0) {
            showToast('Please enter a valid start position (0 or greater).', 'error');
            return;
        }
        if (isNaN(endNum) || endNum < 0) {
            showToast('Please enter a valid end position (0 or greater).', 'error');
            return;
        }
        if (startNum > endNum) {
            showToast('Start position cannot be greater than end position.', 'error');
            return;
        }

        const checkedFiles = getCheckedFiles();
        if (checkedFiles.length === 0) {
            showToast('No files selected for operation.', 'info');
            return;
        }

        const renamePromises = checkedFiles.map(file => {
            const originalName = file.name;
            const newName = originalName.slice(0, startNum) + originalName.slice(endNum);
            return renameFile(driveClient, file.id, newName, originalName);
        });

        try {
            await Promise.all(renamePromises);
            showToast(`Operation 'slice' completed.`, 'success');
            refreshFileList();
        } catch (error) {
            showToast(`An error occurred during slice operation.`, 'error');
            console.error(`Error during slice operation:`, error);
        }
    });
}

/**
 * Handles the "Pad Filename" operation.
 */
function handlePadFilename(driveClient, refreshFileList) {
    showPadFilenameModal(async (numPrefix) => {
        const checkedFiles = getCheckedFiles();
        const renamePromises = checkedFiles.map(file => {
            const paddedFilename = padFilename(file.name, numPrefix);
            return renameFile(driveClient, file.id, paddedFilename, file.name);
        });

        try {
            await Promise.all(renamePromises);
            refreshFileList();
        } catch (error) {
            showToast('An error occurred while padding filenames.', 'error');
            console.error('Error during pad filename:', error);
        }
    });
}

/**
 * Core logic for Replace Text.
 */
async function executeReplace(driveClient, from, to, refreshFileList) {
    const checkedFiles = getCheckedFiles();
    const renamePromises = checkedFiles.map(file => {
        const newFilename = file.name.replace(new RegExp(from, 'g'), to);
        return renameFile(driveClient, file.id, newFilename, file.name);
    });

    try {
        await Promise.all(renamePromises);
        refreshFileList();
        showToast('Rename completed.', 'success');
    } catch (error) {
        showToast('An error occurred during rename.', 'error');
        console.error('Error during rename:', error);
    }
}

/**
 * Core logic for Slice Text.
 */
async function executeSlice(driveClient, startNum, endNum, refreshFileList) {
    const checkedFiles = getCheckedFiles();
    if (checkedFiles.length === 0) {
        showToast('No files selected for operation.', 'info');
        return;
    }

    const renamePromises = checkedFiles.map(file => {
        const originalName = file.name;
        const newName = originalName.slice(0, startNum) + originalName.slice(endNum);
        return renameFile(driveClient, file.id, newName, originalName);
    });

    try {
        await Promise.all(renamePromises);
        showToast(`Operation 'slice' completed.`, 'success');
        refreshFileList();
    } catch (error) {
        showToast(`An error occurred during slice operation.`, 'error');
        console.error(`Error during slice operation:`, error);
    }
}

/**
 * Core logic for Pad Filename.
 */
async function executePad(driveClient, numPrefix, refreshFileList) {
    const checkedFiles = getCheckedFiles();
    const renamePromises = checkedFiles.map(file => {
        const paddedFilename = padFilename(file.name, numPrefix);
        return renameFile(driveClient, file.id, paddedFilename, file.name);
    });

    try {
        await Promise.all(renamePromises);
        showToast('Padding completed.', 'success');
        refreshFileList();
    } catch (error) {
        showToast('An error occurred while padding filenames.', 'error');
        console.error('Error during pad filename:', error);
    }
}

module.exports = {
    handleReplaceText,
    handleSliceText,
    handlePadFilename,
    executeReplace,
    executeSlice,
    executePad
};
