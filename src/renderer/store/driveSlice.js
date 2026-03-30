import React from 'react';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addNotification } from './uiSlice';
import { showToast } from '../utils/toast';
import ErrorToastContent from '../components/common/ErrorToastContent';

const ITEMS_PER_PAGE = 20;
const TIMEOUT_MS = 10000;

/**
 * Common error handler for Google Drive API responses.
 * Detects network errors, authorization issues, and general errors.
 * Returns true if an error was handled.
 */
const handleDriveError = (data, dispatch) => {
  if (!data?.error) return false;

  if (data.errorCode === 'ETIMEDOUT' || data.errorCode === 'NETWORK_ERROR') {
    showToast({
      component: React.createElement(ErrorToastContent, { error: data.error }),
      duration: 10000,
      close: true,
      gravity: "bottom",
      position: "right",
      className: "error-toast"
    });
  } else if (data.authorized === false) {
    // Silently handled by onAuthRequired listener or check-auth
    return true;
  } else {
    dispatch(addNotification({ message: data.error, type: 'error' }));
  }
  return true;
};

export const fetchFolders = createAsyncThunk(
  'drive/fetchFolders',
  async ({ parentId, pageToken = null, append = false, customTimeout = null }, { dispatch }) => {
    if (!window.electronAPI) return null;

    if (!append) dispatch(setFolders({ folders: [], nextPageToken: null }));
    dispatch(setLoadingFolders(true));

    try {
      const timeoutFallback = new Promise(resolve => {
        setTimeout(() => {
          resolve({ error: "Request timed out", errorCode: "ETIMEDOUT" });
        }, 10000);
      });

      const fetchPromise = window.electronAPI.getFolders(parentId, pageToken, customTimeout);
      const data = await Promise.race([fetchPromise, timeoutFallback]);

      if (handleDriveError(data, dispatch)) {
        return null;
      }

      if (append) {
        dispatch(appendFolders(data));
      } else {
        dispatch(setFolders(data));
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      dispatch(addNotification({ message: "An unexpected error occurred while fetching folders.", type: 'error' }));
      return null;
    } finally {
      dispatch(setLoadingFolders(false));
    }
  }
);

export const fetchFiles = createAsyncThunk(
  'drive/fetchFiles',
  async ({ folderId, pageToken = null, append = false, customTimeout = null }, { dispatch }) => {
    if (!window.electronAPI) return null;

    if (!append) dispatch(setFiles({ files: [], nextPageToken: null }));
    dispatch(setLoadingFiles(true));

    try {
      const timeoutFallback = new Promise(resolve => {
        setTimeout(() => {
          resolve({ error: "Request timed out", errorCode: "ETIMEDOUT" });
        }, 10000);
      });

      const fetchPromise = window.electronAPI.getFiles(folderId, pageToken, customTimeout);
      const data = await Promise.race([fetchPromise, timeoutFallback]);

      if (handleDriveError(data, dispatch)) {
        return null;
      }

      if (append) {
        dispatch(appendFiles(data));
      } else {
        dispatch(setFiles(data));
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch files:", error);
      dispatch(addNotification({ message: "An unexpected error occurred while fetching files.", type: 'error' }));
      return null;
    } finally {
      dispatch(setLoadingFiles(false));
    }
  }
);

export const searchFolders = createAsyncThunk(
  'drive/searchFolders',
  async ({ query, pageToken = null }, { dispatch }) => {
    if (!window.electronAPI || !query) return { folders: [], nextPageToken: null };

    dispatch(setSearchingFolders(true));
    try {
      const data = await window.electronAPI.searchFolders(query, pageToken);
      if (handleDriveError(data, dispatch)) {
        return { folders: [], nextPageToken: null };
      }
      return data;
    } catch (error) {
      console.error("Failed to search folders:", error);
      return { folders: [], nextPageToken: null };
    } finally {
      dispatch(setSearchingFolders(false));
    }
  }
);

const initialState = {
  // Navigation
  currentParentId: 'root',
  parentHistory: [], // To allow going "Up"

  folders: [],
  nextFoldersPageToken: null,

  files: [],
  nextFilesPageToken: null,

  searchResults: [],
  isSearchingFolders: false,

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
    setSearchingFolders: (state, action) => {
      state.isSearchingFolders = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload.folders;
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
      if (action.payload.id) {
        state.files = []; // Clear files immediately when selecting a new folder
        state.nextFilesPageToken = null;
      }
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
  setSearchingFolders,
  setSearchResults,
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
