import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isFoldersOpen: true, // Initially true based on previous code rendering Folders by default
  isExecuteSidebarOpen: false,
  notifications: [],
  unreadCount: 0,
  /** When Slice Text is active: show position cursors on file list. { active, start, end } */
  slicePreview: { active: false, start: 0, end: 0 },
  /** Holds the active operation parameters to preview changes in the file list */
  operationPreview: { active: false, type: '', params: {} },
  isNotificationDropdownOpen: false,
  hoveredFileId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleFolders: (state) => {
      state.isFoldersOpen = !state.isFoldersOpen;
      // Mutual exclusivity: if Folders is opened, Execute must be closed
      if (state.isFoldersOpen) {
        state.isExecuteSidebarOpen = false;
      }
    },
    setExecuteSidebarOpen: (state, action) => {
      state.isExecuteSidebarOpen = action.payload;
      if (!action.payload) {
        state.slicePreview = { active: false, start: 0, end: 0 };
        state.operationPreview = { active: false, type: '', params: {} };
      }
      // Mutual exclusivity: if Execute is opened, Folders must be closed
      if (state.isExecuteSidebarOpen) {
        state.isFoldersOpen = false;
      }
    },
    toggleExecute: (state) => {
      state.isExecuteSidebarOpen = !state.isExecuteSidebarOpen;
      if (!state.isExecuteSidebarOpen) {
        state.slicePreview = { active: false, start: 0, end: 0 };
        state.operationPreview = { active: false, type: '', params: {} };
      }
      if (state.isExecuteSidebarOpen) {
        state.isFoldersOpen = false;
      }
    },
    setSlicePreview: (state, action) => {
      state.slicePreview = { ...state.slicePreview, ...action.payload };
    },
    setOperationPreview: (state, action) => {
      state.operationPreview = { ...state.operationPreview, ...action.payload };
    },
    addNotification: (state, action) => {
      // action.payload should be { message, details, fileId, type: 'success' | 'error' | 'info' }
      const newNotif = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(newNotif);
      state.unreadCount += 1;
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setNotificationDropdownOpen: (state, action) => {
      state.isNotificationDropdownOpen = action.payload;
      if (!action.payload) {
        state.hoveredFileId = null;
      }
    },
    setHoveredFileId: (state, action) => {
      state.hoveredFileId = action.payload;
    },
  },
});

export const {
  toggleFolders,
  setExecuteSidebarOpen,
  toggleExecute,
  setSlicePreview,
  setOperationPreview,
  addNotification,
  markAllNotificationsRead,
  removeNotification,
  setNotificationDropdownOpen,
  setHoveredFileId,
} = uiSlice.actions;

export default uiSlice.reducer;
