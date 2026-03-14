import { createSlice } from '@reduxjs/toolkit';

const ITEMS_PER_PAGE = 300;

const initialState = {
  folders: [],
  files: [],
  selectedFolderId: null,
  selectedFolderObj: null,
  isLoadingFolders: false,
  isLoadingFiles: false,

  // Selection
  selectedFileIds: [],

  // Pagination
  currentPage: 1,
  itemsPerPage: ITEMS_PER_PAGE,
};

const driveSlice = createSlice({
  name: 'drive',
  initialState,
  reducers: {
    // Folders
    setLoadingFolders: (state, action) => {
      state.isLoadingFolders = action.payload;
    },
    setFolders: (state, action) => {
      state.folders = action.payload;
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
      state.files = action.payload;
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
  setLoadingFolders,
  setFolders,
  selectFolder,
  setLoadingFiles,
  setFiles,
  toggleFileSelection,
  selectAllFilesOnPage,
  deselectAllFilesOnPage,
  clearAllSelections,
  setPage,
} = driveSlice.actions;

export default driveSlice.reducer;
