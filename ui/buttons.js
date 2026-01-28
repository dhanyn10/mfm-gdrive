// ui/buttons.js
const { getState } = require('../state');

function updateRefreshButton(isLoading) {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        if (isLoading) {
            refreshButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
            refreshButton.disabled = true;
            refreshButton.classList.add('cursor-wait');
        } else {
            refreshButton.innerHTML = `<i class="fas fa-sync-alt"></i>`;
            refreshButton.disabled = false;
            refreshButton.classList.remove('cursor-wait');
        }
    }
}

function updateExecuteButtonVisibility() {
    const { currentFileList } = getState();
    const nextStepBtn = document.getElementById('next-step-btn');
    const navExecuteBtn = document.getElementById('nav-execute');
    
    if (!nextStepBtn) return;

    const hasSelected = currentFileList.some(file => file.checked);
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
    updateRefreshButton,
    updateExecuteButtonVisibility
};
