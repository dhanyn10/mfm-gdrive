// ui/panels.js
const { updateSlicePreview } = require('./helpers');
const { resetFileListItemStyles } = require('./components');

/**
 * Switches the view from the initial authorization screen to the main application UI.
 */
function showMainUI() {
    const appContainer = document.getElementById('app-container');
    const mainView = document.getElementById('main-view');
    const authorizeButton = document.getElementById('authorize');
    const authorizeContainer = document.getElementById('authorize-container');

    // It seems this is ensuring the authorize button is in the correct container,
    // though it might already be there.
    authorizeContainer.appendChild(authorizeButton);

    // Hide the initial container and show the main application view.
    appContainer.classList.add('hidden');
    mainView.classList.remove('hidden');
}

/**
 * Updates the visual styling of the navigation tabs ('Folders', 'Execute')
 * to reflect which panel is currently active.
 */
function updatePanelLayout() {
    const foldersPanel = document.getElementById('folders');
    const sidebarPanel = document.getElementById('execute-sidebar');
    const navFoldersTab = document.getElementById('nav-folders');
    const navExecuteTab = document.getElementById('nav-execute');

    if (!foldersPanel || !sidebarPanel || !navFoldersTab || !navExecuteTab) return;

    const isFoldersVisible = !foldersPanel.classList.contains('hidden');
    const isSidebarVisible = !sidebarPanel.classList.contains('hidden');

    // Update 'Folders' tab style based on its panel's visibility.
    if (isFoldersVisible) {
        navFoldersTab.classList.add('bg-gray-100', 'text-blue-700');
        navFoldersTab.classList.remove('bg-white', 'text-gray-900');
    } else {
        navFoldersTab.classList.remove('bg-gray-100', 'text-blue-700');
        navFoldersTab.classList.add('bg-white', 'text-gray-900');
    }

    // Update 'Execute' tab style based on its panel's visibility.
    if (isSidebarVisible) {
        navExecuteTab.classList.add('bg-gray-100', 'text-blue-700');
        navExecuteTab.classList.remove('bg-white', 'text-gray-900');
    } else {
        navExecuteTab.classList.remove('bg-gray-100', 'text-blue-700');
        navExecuteTab.classList.add('bg-white', 'text-gray-900');
    }
}

/**
 * Manages the visibility of the main content panels ('folders' and 'execute-sidebar').
 * Ensures that only one panel is visible at a time and performs necessary cleanup.
 * @param {('folders'|'execute-sidebar')} panel - The name of the panel to control.
 * @param {boolean} isVisible - True to show the panel, false to hide it.
 */
function setPanelVisibility(panel, isVisible) {
    const foldersPanel = document.getElementById('folders');
    const sidebarPanel = document.getElementById('execute-sidebar');
    const resizer = document.getElementById('sidebar-resizer');

    if (panel === 'folders') {
        if (isVisible) {
            foldersPanel.classList.remove('hidden');
            sidebarPanel.classList.add('hidden');
            if (resizer) resizer.classList.add('hidden');
            updateSlicePreview(-1, -1); // Clear any slice previews.
            resetFileListItemStyles(); // Reset item styles when showing folders.
        } else {
            foldersPanel.classList.add('hidden');
        }
    } else if (panel === 'execute-sidebar') {
        if (isVisible) {
            sidebarPanel.classList.remove('hidden');
            foldersPanel.classList.add('hidden');
            if (resizer) resizer.classList.remove('hidden');
        } else {
            sidebarPanel.classList.add('hidden');
            if (resizer) resizer.classList.add('hidden');
            updateSlicePreview(-1, -1); // Clear any slice previews.
            resetFileListItemStyles(); // Reset item styles when closing the sidebar.
        }
    }
    updatePanelLayout(); // Update tab styles to match panel visibility.
}

/**
 * A convenience function to specifically toggle the execute sidebar.
 * @param {boolean} isVisible - True to show the sidebar, false to hide it.
 */
function toggleExecuteSidebar(isVisible) {
    setPanelVisibility('execute-sidebar', isVisible);
}

module.exports = {
    showMainUI,
    updatePanelLayout,
    setPanelVisibility,
    toggleExecuteSidebar
};
