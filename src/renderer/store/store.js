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

// Expose store for e2e tests
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}
