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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Expose store for e2e tests
if (typeof window !== 'undefined') {
  (window as any).__REDUX_STORE__ = store;
}
