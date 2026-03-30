import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import authReducer from '../store/authSlice';
import driveReducer from '../store/driveSlice';
import uiReducer from '../store/uiSlice';

function render(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        drive: driveReducer,
        ui: uiReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// re-export everything
export * from '@testing-library/react';
// override render method
export { render };
