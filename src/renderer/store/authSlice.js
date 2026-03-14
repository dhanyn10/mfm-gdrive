import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
    setAuthorized: (state, action) => {
      state.isAuthorized = action.payload;
      state.isAuthorizing = false;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isAuthorizing = false;
    },
  },
});

export const { setAuthorizing, setAuthorized, setAuthError } = authSlice.actions;

export default authSlice.reducer;
