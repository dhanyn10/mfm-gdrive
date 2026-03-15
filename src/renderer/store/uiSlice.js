import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isFoldersOpen: true, // Initially true based on previous code rendering Folders by default
  isExecuteSidebarOpen: false,
  notifications: [],
  unreadCount: 0,
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
      // Mutual exclusivity: if Execute is opened, Folders must be closed
      if (state.isExecuteSidebarOpen) {
        state.isFoldersOpen = false;
      }
    },
    toggleExecute: (state) => {
      state.isExecuteSidebarOpen = !state.isExecuteSidebarOpen;
      if (state.isExecuteSidebarOpen) {
        state.isFoldersOpen = false;
      }
    },
    addNotification: (state, action) => {
      // action.payload should be { message, type: 'success' | 'error' | 'info' }
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
  },
});

export const {
  toggleFolders,
  setExecuteSidebarOpen,
  toggleExecute,
  addNotification,
  markAllNotificationsRead,
} = uiSlice.actions;

export default uiSlice.reducer;
