import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: number;
  time: string;
  read: boolean;
  message: string;
  details?: string;
  fileId?: string;
  type: 'success' | 'error' | 'info';
}

export interface UiState {
  isFoldersOpen: boolean;
  isExecuteSidebarOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  slicePreview: { active: boolean; start: number; end: number };
  operationPreview: { active: boolean; type: string; params: any };
  isNotificationDropdownOpen: boolean;
  hoveredFileId: string | null;
}

const initialState: UiState = {
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
    setExecuteSidebarOpen: (state, action: PayloadAction<boolean>) => {
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
    setSlicePreview: (state, action: PayloadAction<Partial<{ active: boolean; start: number; end: number }>>) => {
      state.slicePreview = { ...state.slicePreview, ...action.payload };
    },
    setOperationPreview: (state, action: PayloadAction<Partial<{ active: boolean; type: string; params: any }>>) => {
      state.operationPreview = { ...state.operationPreview, ...action.payload };
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'time' | 'read'>>) => {
      const newNotif: Notification = {
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
    removeNotification: (state, action: PayloadAction<number>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setNotificationDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.isNotificationDropdownOpen = action.payload;
      if (!action.payload) {
        state.hoveredFileId = null;
      }
    },
    setHoveredFileId: (state, action: PayloadAction<string | null>) => {
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
