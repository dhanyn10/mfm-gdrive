// state.js

/**
 * A centralized object to hold the application's state.
 * This makes it easier to manage and reason about the data flow.
 */
const state = {
    /** @type {string} The MIME type for Google Drive folders. */
    mime: "application/vnd.google-apps.folder",

    /** @type {Array<string>} A stack representing the current folder hierarchy, with 'root' at the bottom. */
    arrParentFolder: ['root'],

    /** @type {Array<object>} An array of folder objects currently displayed in the folder list. */
    arrListFolders: [],

    /** @type {Array<object>} An array of file objects currently displayed in the file list. Each object includes properties like id, name, type, and checked status. */
    arrListAllFiles: [],

    /** @type {string|null} The page token for the currently displayed page of files. */
    currentPageToken: null,

    /** @type {string|null} The token for the next page of files, as returned by the Google Drive API. */
    nextPageTokenFromAPI: null,

    /** @type {Array<string>} A stack of previous page tokens, used for navigating back. */
    prevPageTokensStack: [],

    /** @type {boolean} A flag indicating if the initial authorization was successful. */
    isInitialAuthSuccessful: false,

    /** @type {number|null} The index of the last clicked file, used for shift-click range selection. */
    fromIndex: null,
};

/**
 * Updates the global state by merging the new state object.
 * @param {object} newState - An object containing the state properties to update.
 */
function updateState(newState) {
    Object.assign(state, newState);
}

/**
 * Returns the current global state object.
 * @returns {object} The current state.
 */
function getState() {
    return state;
}

/**
 * Retrieves a list of files that are currently checked in the UI.
 * It filters the main file list based on the checked status of the corresponding DOM elements.
 * @returns {Array<object>} An array of checked file objects.
 */
const getCheckedFiles = () => {
    // Note: This relies on the DOM and the state's file list being perfectly in sync.
    const checkedElements = document.getElementsByClassName('cbox-file-folder');
    return state.arrListAllFiles.filter((_, index) => {
        return checkedElements[index] && checkedElements[index].checked;
    });
};

module.exports = { updateState, getState, getCheckedFiles };
