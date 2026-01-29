// ui/buttons.js
const { getState } = require('../state');

function updateAuthorizeButton(isAuthSuccessful, isLoading) {
    const authorizeButton = document.getElementById('authorize');
    const refreshButton = document.getElementById('refresh-button');

    if (authorizeButton) {
        if (isLoading) {
            // When authorizing, show spinner on the big button
            authorizeButton.innerHTML = `<div class="flex flex-col items-center justify-center pt-5 pb-6"><i class="fas fa-spinner fa-spin fa-3x text-gray-500 dark:text-gray-400"></i></div>`;
            authorizeButton.disabled = true;
        } else {
            if (isAuthSuccessful) {
                authorizeButton.classList.add('hidden');
                if (refreshButton) {
                    refreshButton.classList.remove('hidden');
                }
            } else {
                // Reset to original state if auth fails or is needed
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

function updateSelectionButtons() {
    const { arrListAllFiles } = getState();
    const nextStepBtn = document.getElementById('next-step-btn');
    const navExecuteBtn = document.getElementById('nav-execute');
    const selectAllBtn = document.getElementById('select-all');
    const selectNoneBtn = document.getElementById('select-none');
    
    if (!nextStepBtn || !selectAllBtn || !selectNoneBtn) return;

    const hasSelected = arrListAllFiles.some(file => file.checked);
    const allSelected = arrListAllFiles.length > 0 && arrListAllFiles.every(file => file.checked);

    // Update Select All button icon
    if (allSelected) {
        selectAllBtn.innerHTML = `<i class="fa-solid fa-square-check mr-2"></i> Select All`;
    } else {
        selectAllBtn.innerHTML = `<i class="fa-regular fa-square-check mr-2"></i> Select All`;
    }

    // Update visibility for Next Step and Select None buttons
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