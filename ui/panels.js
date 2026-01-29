// ui/panels.js
const { updateSlicePreview } = require('./helpers');

function showMainUI() {
    const appContainer = document.getElementById('app-container');
    const mainView = document.getElementById('main-view');
    const authorizeButton = document.getElementById('authorize');
    const authorizeContainer = document.getElementById('authorize-container');

    authorizeContainer.appendChild(authorizeButton);

    appContainer.classList.add('hidden');
    mainView.classList.remove('hidden');
}

function updatePanelLayout() {
    const folders = document.getElementById('folders');
    const sidebar = document.getElementById('execute-sidebar');
    const navFolders = document.getElementById('nav-folders');
    const navExecute = document.getElementById('nav-execute');

    if (!folders || !sidebar || !navFolders || !navExecute) return;

    const foldersVisible = !folders.classList.contains('hidden');
    const sidebarVisible = !sidebar.classList.contains('hidden');

    if (foldersVisible) {
        navFolders.classList.add('bg-gray-100', 'text-blue-700');
        navFolders.classList.remove('bg-white', 'text-gray-900');
    } else {
        navFolders.classList.remove('bg-gray-100', 'text-blue-700');
        navFolders.classList.add('bg-white', 'text-gray-900');
    }

    if (sidebarVisible) {
        navExecute.classList.add('bg-gray-100', 'text-blue-700');
        navExecute.classList.remove('bg-white', 'text-gray-900');
    } else {
        navExecute.classList.remove('bg-gray-100', 'text-blue-700');
        navExecute.classList.add('bg-white', 'text-gray-900');
    }
}

function setPanelVisibility(panel, isVisible) {
    const folders = document.getElementById('folders');
    const sidebar = document.getElementById('execute-sidebar');
    const resizer = document.getElementById('sidebar-resizer');

    if (panel === 'folders') {
        if (isVisible) {
            folders.classList.remove('hidden');
            sidebar.classList.add('hidden');
            if (resizer) resizer.classList.add('hidden');
            updateSlicePreview(-1, -1);
        } else {
            folders.classList.add('hidden');
        }
    } else if (panel === 'execute-sidebar') {
        if (isVisible) {
            sidebar.classList.remove('hidden');
            folders.classList.add('hidden');
            if (resizer) resizer.classList.remove('hidden');
        } else {
            sidebar.classList.add('hidden');
            if (resizer) resizer.classList.add('hidden');
            updateSlicePreview(-1, -1);
        }
    }
    updatePanelLayout();
}

function toggleExecuteSidebar(isVisible) {
    setPanelVisibility('execute-sidebar', isVisible);
}

module.exports = {
    showMainUI,
    updatePanelLayout,
    setPanelVisibility,
    toggleExecuteSidebar
};
