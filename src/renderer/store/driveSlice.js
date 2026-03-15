import { createSlice } from '@reduxjs/toolkit';

const ITEMS_PER_PAGE = 300;

const initialState = {
  // Navigation
  currentParentId: 'root',
  parentHistory: [], // To allow going "Up"

  folders: [],
  nextFoldersPageToken: null,

  files: [],
  nextFilesPageToken: null,

  selectedFolderId: null,
  selectedFolderObj: null,

  isLoadingFolders: false,
  isLoadingFiles: false,

  // Selection
  selectedFileIds: [],

  // Pagination
  currentPage: 1,
  itemsPerPage: ITEMS_PER_PAGE,

  refreshTrigger: 0,
};

const driveSlice = createSlice({
  name: 'drive',
  initialState,
  reducers: {
    // Navigation
    setCurrentParentId: (state, action) => {
      state.currentParentId = action.payload;
    },
    pushParentHistory: (state, action) => {
      state.parentHistory.push(action.payload);
    },
    popParentHistory: (state) => {
      if (state.parentHistory.length > 0) {
          state.currentParentId = state.parentHistory.pop();
      } else {
          state.currentParentId = 'root';
      }
    },

    // Folders
    setLoadingFolders: (state, action) => {
      state.isLoadingFolders = action.payload;
    },
    setFolders: (state, action) => {
      state.folders = action.payload.folders;
      state.nextFoldersPageToken = action.payload.nextPageToken;
    },
    appendFolders: (state, action) => {
      state.folders = [...state.folders, ...action.payload.folders];
      state.nextFoldersPageToken = action.payload.nextPageToken;
    },
    selectFolder: (state, action) => {
      state.selectedFolderId = action.payload.id;
      state.selectedFolderObj = action.payload;
      state.currentPage = 1; // Reset page on folder change
      state.selectedFileIds = []; // Reset selection on folder change
    },

    // Files
    setLoadingFiles: (state, action) => {
      state.isLoadingFiles = action.payload;
    },
    setFiles: (state, action) => {
      state.files = action.payload.files;
      state.nextFilesPageToken = action.payload.nextPageToken;
    },
    appendFiles: (state, action) => {
      state.files = [...state.files, ...action.payload.files];
      state.nextFilesPageToken = action.payload.nextPageToken;
    },

    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },

    // File Selection
    toggleFileSelection: (state, action) => {
      const fileId = action.payload;
      if (state.selectedFileIds.includes(fileId)) {
        state.selectedFileIds = state.selectedFileIds.filter(id => id !== fileId);
      } else {
        state.selectedFileIds.push(fileId);
      }
    },
    selectAllFilesOnPage: (state, action) => {
      const pageFileIds = action.payload;
      const newSelections = new Set([...state.selectedFileIds, ...pageFileIds]);
      state.selectedFileIds = Array.from(newSelections);
    },
    selectFileRange: (state, action) => {
      const rangeFileIds = action.payload;
      const newSelections = new Set([...state.selectedFileIds, ...rangeFileIds]);
      state.selectedFileIds = Array.from(newSelections);
    },
    deselectAllFilesOnPage: (state, action) => {
      const pageFileIds = action.payload;
      state.selectedFileIds = state.selectedFileIds.filter(id => !pageFileIds.includes(id));
    },
    clearAllSelections: (state) => {
      state.selectedFileIds = [];
    },

    // Pagination
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  setCurrentParentId,
  pushParentHistory,
  popParentHistory,
  setLoadingFolders,
  setFolders,
  appendFolders,
  selectFolder,
  setLoadingFiles,
  setFiles,
  appendFiles,
  toggleFileSelection,
  selectAllFilesOnPage,
  selectFileRange,
  deselectAllFilesOnPage,
  clearAllSelections,
  setPage,
  triggerRefresh,
} = driveSlice.actions;

export default driveSlice.reducer;
