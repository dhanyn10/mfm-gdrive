import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import driveReducer from './driveSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    drive: driveReducer,
    ui: uiReducer,
  },
});
