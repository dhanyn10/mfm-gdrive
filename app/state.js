// state.js

const state = {
    mime: "application/vnd.google-apps.folder",
    arrParentFolder: ['root'],
    arrListFolders: [],
    arrListAllFiles: [],
    currentPageToken: null,
    nextPageTokenFromAPI: null,
    prevPageTokensStack: [],
    isInitialAuthSuccessful: false,
    fromIndex: null,
    toIndex: null,
};

function updateState(newState) {
    Object.assign(state, newState);
}

function getState() {
    return state;
}

const getCheckedFiles = () => {
    const checkedElements = document.getElementsByClassName('cbox-file-folder');
    return state.arrListAllFiles.filter((_, index) => checkedElements[index].checked);
};


module.exports = { updateState, getState, getCheckedFiles };