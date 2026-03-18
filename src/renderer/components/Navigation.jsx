import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFolders, toggleExecute } from '../store/uiSlice';
import { fetchFolders, fetchFiles } from '../store/driveSlice';
import NotificationDropdown from './NotificationDropdown';

function Navigation() {
  const dispatch = useDispatch();
  const isFoldersOpen = useSelector(state => state.ui.isFoldersOpen);
  const isExecuteSidebarOpen = useSelector(state => state.ui.isExecuteSidebarOpen);
  const unreadCount = useSelector(state => state.ui.unreadCount);
  const selectedFileIds = useSelector(state => state.drive.selectedFileIds);
  const currentParentId = useSelector(state => state.drive.currentParentId);
  const selectedFolderId = useSelector(state => state.drive.selectedFolderId);
  const isLoadingFolders = useSelector(state => state.drive.isLoadingFolders);
  const isLoadingFiles = useSelector(state => state.drive.isLoadingFiles);

  const hasSelections = selectedFileIds.length > 0;
  const isRefreshing = isLoadingFolders || isLoadingFiles;

  const handleGlobalRefresh = () => {
    // Dispatch fetch actions with custom timeout (e.g., 5000ms as originally used for folders refresh)
    dispatch(fetchFolders({ parentId: currentParentId, customTimeout: 5000 }));
    if (selectedFolderId) {
      dispatch(fetchFiles({ folderId: selectedFolderId, customTimeout: 5000 }));
    }
  };

  return (
    <nav className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-4 flex-none">
      <div className="container mx-auto flex items-center p-4 relative">
        <div className="flex-grow flex justify-center">
          <div className="inline-flex rounded-md" role="group">
            <button
              onClick={() => dispatch(toggleFolders())}
              type="button"
              className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-s-lg focus:z-10 dark:border-gray-600 transition-colors ${
                isFoldersOpen
                  ? 'text-blue-700 bg-gray-100 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              }`}
            >
              Folders
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border-t border-b border-gray-200 focus:z-10 dark:border-gray-600 text-blue-700 bg-gray-100 dark:bg-gray-700 dark:text-white cursor-default"
            >
              Files
            </button>
            <button
              onClick={() => dispatch(toggleExecute())}
              type="button"
              disabled={!hasSelections}
              className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-e-lg focus:z-10 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isExecuteSidebarOpen
                  ? 'text-blue-700 bg-gray-100 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              }`}
            >
              Execute
            </button>
          </div>
        </div>

        <div className="absolute right-4 flex items-center space-x-2">
          <button
            data-testid="refresh-button"
            className="px-2 py-1 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white flex items-center justify-center min-w-[32px] min-h-[28px]"
            title="Refresh"
            onClick={handleGlobalRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
            )}
          </button>
          <NotificationDropdown count={unreadCount} />
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
