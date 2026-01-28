// state.js

/**
 * @typedef {Object} AppState
 * @property {string} FOLDER_MIME_TYPE - The MIME type for Google Drive folders.
 * @property {string[]} folderIdStack - An array representing the current folder hierarchy, with the last element being the current folder ID.
 * @property {Array<object>} currentFolderList - A list of folder objects in the current directory.
 * @property {Array<object>} currentFileList - A list of file objects in the current directory.
 * @property {string|null} currentPageToken - The page token for the current view of files.
 * @property {string|null} nextPageToken - The token provided by the API for the next page of results.
 * @property {string[]} prevPageTokens - A stack of page tokens for previous pages, to enable "back" pagination.
 * @property {boolean} isAuthorized - Flag indicating if the user has successfully authorized the application.
 * @property {number|null} selectionStartIndex - The starting index for shift-click range selections in the file list.
 */

/**
 * The global state of the application.
 * @type {AppState}
 */
const state = {
    FOLDER_MIME_TYPE: "application/vnd.google-apps.folder",
    folderIdStack: ['root'],
    currentFolderList: [],
    currentFileList: [],
    currentPageToken: null,
    nextPageToken: null,
    prevPageTokens: [],
    isAuthorized: false,
    selectionStartIndex: null,
};

/**
 * Updates the global state with new values.
 * @param {Partial<AppState>} newState - An object containing the state properties to update.
 */
function updateState(newState) {
    Object.assign(state, newState);
}

/**
 * Returns the current global state.
 * @returns {AppState} The current state object.
 */
function getState() {
    return state;
}

/**
 * Retrieves all file objects that are currently checked in the UI.
 * @returns {Array<object>} An array of the selected file objects.
 */
const getCheckedFiles = () => {
    return state.currentFileList.filter(file => file.checked);
};


module.exports = { updateState, getState, getCheckedFiles };
