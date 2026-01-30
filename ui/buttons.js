// ui/buttons.js
const { getState } = require('../state');

/**
 * Updates the state and appearance of the main authorization button.
 * It handles loading, success, and initial/failure states.
 * @param {boolean} isAuthSuccessful - True if authorization was successful.
 * @param {boolean} isLoading - True if an authorization process is currently in progress.
 */
function updateAuthorizeButton(isAuthSuccessful, isLoading) {
    const authorizeButton = document.getElementById('authorize');
    const refreshButton = document.getElementById('refresh-button');

    if (authorizeButton) {
        if (isLoading) {
            // When authorizing, show a spinner on the large button and disable it.
            authorizeButton.innerHTML = `<div class="flex flex-col items-center justify-center pt-5 pb-6"><i class="fas fa-spinner fa-spin fa-3x text-gray-500 dark:text-gray-400"></i></div>`;
            authorizeButton.disabled = true;
        } else {
            if (isAuthSuccessful) {
                // If authorization is successful, hide the main auth button and show the refresh button.
                authorizeButton.classList.add('hidden');
                if (refreshButton) {
                    refreshButton.classList.remove('hidden');
                }
            } else {
                // Reset to the original state if authorization fails or is required.
                authorizeButton.innerHTML = `<div class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <i class="fab fa-google-drive fa-3x text-gray-500 dark:text-gray-400 mb-4"></i>
                        <p class="mb-2 text-lg font-bold text-gray-700 dark:text-gray-300">Authorize with Google</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 text-center px-4">Click here to sign in and grant permission to access your Google Drive files.</p>
                    </div>
                </div>`;
                authorizeButton.classList.remove('hidden');
                if (refreshButton) {
                    refreshButton.classList.add('hidden');
                }
            }
            authorizeButton.disabled = false;
        }
    }
}

/**
 * Toggles the loading state of the refresh button.
 * @param {boolean} isLoading - True to show the loading spinner, false to show the sync icon.
 */
function setRefreshButtonLoading(isLoading) {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        if (isLoading) {
            refreshButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            refreshButton.disabled = true;
        } else {
            refreshButton.innerHTML = `<i class="fas fa-sync-alt"></i>`;
            refreshButton.disabled = false;
        }
    }
}

/**
 * Updates the visibility and state of selection-related buttons
 * ("Select All", "Select None", "Next Step") based on the current file selection.
 */
function updateSelectionButtons() {
    const { arrListAllFiles } = getState();
    const nextStepBtn = document.getElementById('next-step-btn');
    const navExecuteBtn = document.getElementById('nav-execute');
    const selectAllBtn = document.getElementById('select-all');
    const selectNoneBtn = document.getElementById('select-none');
    
    if (!nextStepBtn || !selectAllBtn || !selectNoneBtn) return;

    const hasSelected = arrListAllFiles.some(file => file.checked);
    const allSelected = arrListAllFiles.length > 0 && arrListAllFiles.every(file => file.checked);

    // Update the "Select All" button icon to reflect whether all items are selected.
    if (allSelected) {
        selectAllBtn.innerHTML = `<i class="fa-solid fa-square-check mr-2"></i> Select All`;
    } else {
        selectAllBtn.innerHTML = `<i class="fa-regular fa-square-check mr-2"></i> Select All`;
    }

    // Show or hide the "Next Step" and "Select None" buttons based on whether any files are selected.
    // Also enables or disables the main "Execute" navigation tab.
    if (hasSelected) {
        nextStepBtn.classList.remove('hidden');
        selectNoneBtn.classList.remove('hidden');
        if (navExecuteBtn) {
            navExecuteBtn.disabled = false;
        }
    } else {
        nextStepBtn.classList.add('hidden');
        selectNoneBtn.classList.add('hidden');
        if (navExecuteBtn) {
            navExecuteBtn.disabled = true;
        }
    }
}

module.exports = {
    updateAuthorizeButton,
    setRefreshButtonLoading,
    updateSelectionButtons
};
