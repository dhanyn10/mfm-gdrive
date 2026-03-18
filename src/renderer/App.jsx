import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TitleBar from './components/TitleBar';
import AuthView from './components/AuthView';
import Navigation from './components/Navigation';
import FolderList from './components/FolderList';
import FileList from './components/FileList';
import ExecuteSidebar from './components/ExecuteSidebar';
import { setAuthorized, setAuthorizing } from './store/authSlice';
import { addNotification } from './store/uiSlice';

function App() {
  const dispatch = useDispatch();
  const isAuthorized = useSelector((state) => state.auth.isAuthorized);
  const isExecuteSidebarOpen = useSelector((state) => state.ui.isExecuteSidebarOpen);
  const isFoldersOpen = useSelector((state) => state.ui.isFoldersOpen);

  // Default sidebar width 33.33vw (1/3 of screen)
  const [sidebarWidth, setSidebarWidth] = useState(() => window.innerWidth / 3);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      // Calculate new width based on mouse position from the right side of the window
      const newWidth = window.innerWidth - e.clientX;

      // Constraints:
      // min width 30% of viewport
      const minWidth = window.innerWidth * 0.3;
      // max width 50% of viewport
      const maxWidth = window.innerWidth * 0.5;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      } else if (newWidth < minWidth) {
        setSidebarWidth(minWidth);
      } else if (newWidth > maxWidth) {
        setSidebarWidth(maxWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    // Check initial auth status
    const checkAuth = async () => {
      if (window.electronAPI) {
        dispatch(setAuthorizing());
        try {
          const authorized = await window.electronAPI.checkAuth();
          dispatch(setAuthorized(authorized));
        } catch (error) {
          console.error("Auth check failed:", error);
          dispatch(setAuthorized(false));
        }
      }
    };

    checkAuth();

    // Setup global listeners (auth status updates, notifications from main)
    let removeUpdateStatus, removeAuthSuccess, removeOperationComplete;

    if (window.electronAPI) {
      removeUpdateStatus = window.electronAPI.onUpdateStatus((status) => {
        dispatch(addNotification({ message: status, type: 'info' }));
      });

      removeAuthSuccess = window.electronAPI.onAuthSuccess(() => {
        dispatch(setAuthorized(true));
        dispatch(addNotification({ message: "Successfully authorized with Google Drive", type: "success" }));
      });

      removeOperationComplete = window.electronAPI.onOperationComplete((data) => {
          if (typeof data === 'string') {
              dispatch(addNotification({ message: data, type: "success" }));
          } else if (data && data.newName && data.oldName) {
              dispatch(addNotification({
                  message: `Renamed ${data.oldName} to ${data.newName}`,
                  oldName: data.oldName,
                  fileId: data.fileId,
                  type: "success"
              }));
          }
      });
    }

    return () => {
      if (removeUpdateStatus) removeUpdateStatus();
      if (removeAuthSuccess) removeAuthSuccess();
      if (removeOperationComplete) removeOperationComplete();
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <TitleBar />

      {!isAuthorized ? (
        <AuthView />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <Navigation />

          <div className="container mx-auto px-4 flex-1 min-h-0 pb-4 flex h-full">
            {/* Folders List - Fixed width */}
            {isFoldersOpen && (
              <div className="w-1/4 min-w-[250px] mr-2 h-full">
                 <FolderList />
              </div>
            )}

            {/* Main File Area - Flexible width */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
              <FileList />
            </div>

            {/* Resizer */}
            {isExecuteSidebarOpen && (
               <div
                 className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors mx-2"
                 onMouseDown={startResizing}
               ></div>
            )}

            {/* Execute Sidebar - Dynamic width when open */}
            {isExecuteSidebarOpen && (
               <div style={{ width: sidebarWidth, flexShrink: 0 }} className="h-full">
                  <ExecuteSidebar />
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
