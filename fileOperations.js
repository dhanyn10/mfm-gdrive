// fileOperations.js
const { myswal, inputClass } = require('./swal-helpers');
const { showToast, padFilename } = require('./utils');
const { renameFile } = require('./driveApi');
const { getState, getCheckedFiles } = require('./state');

/**
 * Handles the "Replace Text" operation.
 */
function handleReplaceText(driveClient, refreshFileList) {
    const mfmOptChildren = document.getElementById('mfm-opt').children[0];
    myswal.fire({
        title: mfmOptChildren[1].innerHTML,
        html:
            '<input id="from" placeholder="from" class="' + inputClass + '">' +
            '<input id="to" placeholder="to" class="' + inputClass + '">',
        confirmButtonText: "RUN",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            const from = document.getElementById('from').value;
            const to = document.getElementById('to').value;
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
        }
    });
}

/**
 * Handles the "Slice Text" operation.
 */
function handleSliceText(driveClient, refreshFileList) {
    const mfmOptChildren = document.getElementById('mfm-opt').children[0];
    myswal.fire({
        title: mfmOptChildren[2].innerHTML,
        html:
            '<input type="number" id="start" placeholder="start (position 1, 2, ...)" class="' + inputClass + '">' +
            '<input type="number" id="end" placeholder="end (position 1, 2, ..., inclusive)" class="' + inputClass + '">', // 'end' is no longer optional
        confirmButtonText: "RUN",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        preConfirm: () => {
            const startInput = document.getElementById('start').value;
            const endInput = document.getElementById('end').value;

            const start = parseInt(startInput);
            const end = parseInt(endInput); // end is now parsed directly, not checked for undefined

            // --- Validation: Both start and end are REQUIRED and must be valid numbers >= 1 ---
            if (isNaN(start) || start < 1) {
                Swal.showValidationMessage('Please enter a valid start position (1 or greater).');
                return false;
            }
            if (isNaN(end) || end < 1) { // End is now mandatory
                Swal.showValidationMessage('Please enter a valid end position (1 or greater).');
                return false;
            }
            // --- End Validation ---

            if (start > end) {
                Swal.showValidationMessage('Start position cannot be greater than end position.');
                return false;
            }
            return { start, end };
        }
    }).then(async (res) => {
        if (res.isConfirmed && res.value) {
            const { start, end } = res.value; // Both start and end are guaranteed to be numbers >= 1

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

                if (lastDotIndex > 0) { // Check if a dot exists and it's not the first character
                    baseName = originalName.substring(0, lastDotIndex);
                    extension = originalName.substring(lastDotIndex);
                }

                // Apply slicing logic to the baseName only
                const len = baseName.length;
                let actualStart = start - 1;
                let actualEndForSlice = end;

                // Ensure indices are within valid bounds of the baseName
                if (actualStart < 0) actualStart = 0;
                if (actualStart > len) actualStart = len;

                if (actualEndForSlice < actualStart) actualEndForSlice = actualStart;
                if (actualEndForSlice > len) actualEndForSlice = len;

                // Logic to construct the new base name
                // Remove characters from 'start' position (1-based) up to and including 'end' position (1-based).
                // This means we combine the part *before* 'start' with the part *after* 'end'.
                const newBaseName = baseName.slice(0, actualStart) + baseName.slice(actualEndForSlice);

                const finalNewName = newBaseName + extension;

                // Log the renaming process for debugging purposes
                console.log(`Original: ${originalName}, Sliced Base: ${newBaseName}, Final New: ${finalNewName}`);

                // Return the promise from the actual rename operation
                return renameFile(driveClient, file.id, finalNewName, originalName);
            });

            // --- Execute all rename operations and handle results ---
            try {
                await Promise.all(renamePromises); // Wait for all rename promises to resolve
                showToast(`Operation 'slice' completed.`, 'success');
                refreshFileList();
            } catch (error) {
                // Catch any errors during the rename process and display a toast message
                showToast(`An error occurred during slice operation.`, 'error');
                console.error(`Error during slice operation:`, error);
            }
        }
    });
}

/**
 * Handles the "Pad Filename" operation.
 */
function handlePadFilename(driveClient, refreshFileList) {
    const mfmOptChildren = document.getElementById('mfm-opt').children[0];
    myswal.fire({
        title: mfmOptChildren[3].innerHTML,
        html:
            '<input id="numprefix" placeholder="expected value" class="' + inputClass + '">',
        confirmButtonText: "RUN",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: 'off',
            autocorrect: 'off'
        }
    }).then(async (res) => {
        if (res.isConfirmed) {
            const numPrefix = document.getElementById('numprefix').value;
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
        }
    });
}

module.exports = {
    handleReplaceText,
    handleSliceText,
    handlePadFilename
};