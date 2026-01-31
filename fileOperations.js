const { padFilename } = require('./utils');
const { renameFile } = require('./driveApi');
const { getCheckedFiles } = require('./state');
const { addNotification } = require('./ui');

/**
 * Executes the "Replace Text" operation for all checked files.
 * @param {import('googleapis').drive_v3.Drive} driveClient - The authorized Google Drive API client.
 * @param {string} from - The text to replace.
 * @param {string} to - The text to replace with.
 * @param {function} refreshFileList - A callback function to refresh the file list in the UI.
 */
async function executeReplace(driveClient, from, to, refreshFileList) {
    const checkedFiles = getCheckedFiles();
    if (checkedFiles.length === 0) {
        addNotification('No files selected for operation.', 'info');
        return;
    }

    const renamePromises = checkedFiles.map(file => {
        const newFilename = file.name.replace(new RegExp(from, 'g'), to);
        if (newFilename === file.name) return Promise.resolve(); // Skip if no change
        return renameFile(driveClient, file.id, newFilename, file.name, refreshFileList);
    });

    try {
        await Promise.all(renamePromises);
        refreshFileList();
    } catch (error) {
        addNotification('An error occurred during rename.', 'error');
        console.error('Error during rename:', error);
    }
}

/**
 * Executes the "Slice Text" operation for all checked files.
 * @param {import('googleapis').drive_v3.Drive} driveClient - The authorized Google Drive API client.
 * @param {number} startNum - The starting index for the slice (inclusive).
 * @param {number} endNum - The ending index for the slice (exclusive).
 * @param {function} refreshFileList - A callback function to refresh the file list in the UI.
 */
async function executeSlice(driveClient, startNum, endNum, refreshFileList) {
    const checkedFiles = getCheckedFiles();
    if (checkedFiles.length === 0) {
        addNotification('No files selected for operation.', 'info');
        return;
    }

    const renamePromises = checkedFiles.map(file => {
        const originalName = file.name;
        const newName = originalName.slice(0, startNum) + originalName.slice(endNum);
        if (newName === originalName) return Promise.resolve(); // Skip if no change
        return renameFile(driveClient, file.id, newName, originalName, refreshFileList);
    });

    try {
        await Promise.all(renamePromises);
        addNotification(`Operation 'slice' completed.`, 'success');
        refreshFileList();
    } catch (error) {
        addNotification(`An error occurred during slice operation.`, 'error');
        console.error(`Error during slice operation:`, error);
    }
}

/**
 * Executes the "Pad Filename" operation for all checked files.
 * It pads the first number found in each filename with leading zeros.
 * @param {import('googleapis').drive_v3.Drive} driveClient - The authorized Google Drive API client.
 * @param {number} numPrefix - The target length for the number padding.
 * @param {function} refreshFileList - A callback function to refresh the file list in the UI.
 */
async function executePad(driveClient, numPrefix, refreshFileList) {
    const checkedFiles = getCheckedFiles();
    if (checkedFiles.length === 0) {
        addNotification('No files selected for operation.', 'info');
        return;
    }

    const renamePromises = checkedFiles.map(file => {
        const paddedFilename = padFilename(file.name, numPrefix);
        if (paddedFilename === file.name) return Promise.resolve(); // Skip if no change
        return renameFile(driveClient, file.id, paddedFilename, file.name, refreshFileList);
    });

    try {
        await Promise.all(renamePromises);
        addNotification('Padding completed.', 'success');
        refreshFileList();
    } catch (error) {
        addNotification('An error occurred while padding filenames.', 'error');
        console.error('Error during pad filename:', error);
    }
}

module.exports = {
    executeReplace,
    executeSlice,
    executePad
};
