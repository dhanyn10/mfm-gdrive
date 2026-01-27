
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
            const newFilename = file.name.replace(from, to);
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

        if (isNaN(startNum) || startNum < 1) {
            showToast('Please enter a valid start position (1 or greater).', 'error');
            return;
        }
        if (isNaN(endNum) || endNum < 1) {
            showToast('Please enter a valid end position (1 or greater).', 'error');
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
            const lastDotIndex = originalName.lastIndexOf('.');
            let baseName = originalName;
            let extension = '';

            if (lastDotIndex > 0) {
                baseName = originalName.substring(0, lastDotIndex);
                extension = originalName.substring(lastDotIndex);
            }

            const len = baseName.length;
            let actualStart = startNum - 1;
            let actualEndForSlice = endNum;

            if (actualStart < 0) actualStart = 0;
            if (actualStart > len) actualStart = len;
            if (actualEndForSlice < actualStart) actualEndForSlice = actualStart;
            if (actualEndForSlice > len) actualEndForSlice = len;

            const newBaseName = baseName.slice(0, actualStart) + baseName.slice(actualEndForSlice);
            const finalNewName = newBaseName + extension;
            return renameFile(driveClient, file.id, finalNewName, originalName);
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
        const newFilename = file.name.replace(from, to);
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
        const lastDotIndex = originalName.lastIndexOf('.');
        let baseName = originalName;
        let extension = '';

        if (lastDotIndex > 0) {
            baseName = originalName.substring(0, lastDotIndex);
            extension = originalName.substring(lastDotIndex);
        }

        const len = baseName.length;
        let actualStart = startNum - 1;
        let actualEndForSlice = endNum;

        if (actualStart < 0) actualStart = 0;
        if (actualStart > len) actualStart = len;
        if (actualEndForSlice < actualStart) actualEndForSlice = actualStart;
        if (actualEndForSlice > len) actualEndForSlice = len;

        const newBaseName = baseName.slice(0, actualStart) + baseName.slice(actualEndForSlice);
        const finalNewName = newBaseName + extension;
        return renameFile(driveClient, file.id, finalNewName, originalName);
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
