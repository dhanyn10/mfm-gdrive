import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthorized: boolean;
  isAuthorizing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthorized: false,
  isAuthorizing: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthorizing: (state) => {
      state.isAuthorizing = true;
      state.error = null;
    },
    setAuthorized: (state, action: PayloadAction<boolean>) => {
      state.isAuthorized = action.payload;
      state.isAuthorizing = false;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isAuthorizing = false;
    },
  },
});

export const { setAuthorizing, setAuthorized, setAuthError } = authSlice.actions;

export default authSlice.reducer;
