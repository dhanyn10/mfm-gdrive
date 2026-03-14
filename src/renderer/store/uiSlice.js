import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTab: 'files', // 'folders', 'files', 'execute'
  isExecuteSidebarOpen: false,
  notifications: [],
  unreadCount: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      // Handle mutual exclusivity for mobile/small views if needed
    },
    setExecuteSidebarOpen: (state, action) => {
      state.isExecuteSidebarOpen = action.payload;
      if (action.payload) {
        state.activeTab = 'execute';
      } else if (state.activeTab === 'execute') {
        state.activeTab = 'files';
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
  setActiveTab,
  setExecuteSidebarOpen,
  addNotification,
  markAllNotificationsRead,
} = uiSlice.actions;

export default uiSlice.reducer;
