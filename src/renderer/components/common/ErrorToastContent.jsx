/* eslint-disable react/prop-types */
import React from 'react';

/**
 * A reusable component for the Drive network error toast.
 * Encapsulates the icon and the collapsible detailed error message.
 */
const ErrorToastContent = ({ error }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      {/* Warning Icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        stroke="currentColor" 
        style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0, marginTop: '2px' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      
      {/* Error Details */}
      <details style={{ maxWidth: '250px', flexGrow: 1 }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold', 
          color: '#111827', 
          listStyle: 'none', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          Network Error
        </summary>
        <div style={{ 
          marginTop: '8px', 
          whiteSpace: 'nowrap', 
          overflowX: 'auto', 
          paddingBottom: '4px', 
          color: '#374151' 
        }}>
          {error}
        </div>
      </details>
    </div>
  );
};

export default ErrorToastContent;
