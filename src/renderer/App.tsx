import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TitleBar from './components/TitleBar';
import AuthView from './components/AuthView';
import Navigation from './components/Navigation';
import FolderList from './components/FolderList';
import FileList from './components/FileList';
import ExecuteSidebar from './components/ExecuteSidebar';
import { setAuthorized, setAuthorizing } from './store/authSlice';
import { addNotification } from './store/uiSlice';

import { RootState } from './store/store';

function App() {
  const dispatch = useDispatch();
  const isAuthorized = useSelector((state: RootState) => state.auth.isAuthorized);
  const isExecuteSidebarOpen = useSelector((state: RootState) => state.ui.isExecuteSidebarOpen);
  const isFoldersOpen = useSelector((state: RootState) => state.ui.isFoldersOpen);

  useEffect(() => {
    // Check initial auth status
    const checkAuth = async () => {
      if ((window as any).electronAPI) {
        dispatch(setAuthorizing());
        try {
          const authorized = await ((window as any).electronAPI as any).checkAuth();
          dispatch(setAuthorized(authorized));
        } catch (error) {
          console.error("Auth check failed:", error);
          dispatch(setAuthorized(false));
        }
      }
    };

    checkAuth();

    // Setup global listeners (auth status updates, notifications from main)
    let removeUpdateStatus: any, removeAuthSuccess: any, removeOperationComplete: any;

    if ((window as any).electronAPI) {
      removeUpdateStatus = ((window as any).electronAPI as any).onUpdateStatus((status: string) => {
        dispatch(addNotification({ message: status, type: 'info' }));
      });

      removeAuthSuccess = ((window as any).electronAPI as any).onAuthSuccess(() => {
        dispatch(setAuthorized(true));
        dispatch(addNotification({ message: "Successfully authorized with Google Drive", type: "success" }));
      });

      removeOperationComplete = ((window as any).electronAPI as any).onOperationComplete((data: any) => {
          if (typeof data === 'string') {
              dispatch(addNotification({ message: data, type: "success" }));
          } else if (data && data.newName && data.oldName) {
              dispatch(addNotification({
                  message: `Renamed ${data.oldName} to ${data.newName}`,
                  details: `Renamed ${data.oldName} to ${data.newName}`,
                  fileId: data.fileId,
                  type: "success"
              } as any));
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
               <div className="w-px cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors mx-2"></div>
            )}

            {/* Execute Sidebar - Fixed width when open */}
            {isExecuteSidebarOpen && (
               <div className="w-1/3 min-w-[300px] h-full">
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
