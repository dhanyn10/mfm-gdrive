// ui/buttons.js
const { getState } = require('../state');

function updateAuthorizeButton(isAuthSuccessful, isLoading) {
    const authorizeButton = document.getElementById('authorize');
    if (authorizeButton) {
        authorizeButton.className = ''; 
        authorizeButton.classList.add('px-2', 'py-1', 'text-sm', 'font-medium', 'text-white', 'bg-blue-700', 'rounded-lg', 'hover:bg-blue-800', 'focus:outline-none');

        if (isLoading) {
            authorizeButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            authorizeButton.disabled = true;
            authorizeButton.classList.add('cursor-wait');
        } else {
            if (isAuthSuccessful) {
                authorizeButton.title = 'Refresh';
                authorizeButton.innerHTML = `<i class="fas fa-sync-alt"></i>`;
                authorizeButton.setAttribute('data-testid', 'refresh-button');
            } else {
                authorizeButton.textContent = 'Authorize';
                authorizeButton.setAttribute('data-testid', 'auth-button');
            }
            authorizeButton.disabled = false;
            authorizeButton.classList.add('cursor-pointer');
        }
    }
}

function updateExecuteButtonVisibility() {
    const { arrListAllFiles } = getState();
    const nextStepBtn = document.getElementById('next-step-btn');
    const navExecuteBtn = document.getElementById('nav-execute');
    
    if (!nextStepBtn) return;

    const hasSelected = arrListAllFiles.some(file => file.checked);
    if (hasSelected) {
        nextStepBtn.classList.remove('hidden');
        if (navExecuteBtn) {
            navExecuteBtn.disabled = false;
        }
    } else {
        nextStepBtn.classList.add('hidden');
        if (navExecuteBtn) {
            navExecuteBtn.disabled = true;
        }
    }
}

module.exports = {
    updateAuthorizeButton,
    updateExecuteButtonVisibility
};
