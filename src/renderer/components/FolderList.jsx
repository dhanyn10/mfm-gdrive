import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFolders, selectFolder, setLoadingFolders, appendFolders, setCurrentParentId, pushParentHistory, popParentHistory } from '../store/driveSlice';
import { addNotification } from '../store/uiSlice';
import Toastify from 'toastify-js';
import { Spinner } from './common/Spinner';

function FolderList() {
  const dispatch = useDispatch();
  const folders = useSelector(state => state.drive.folders);
  const isLoading = useSelector(state => state.drive.isLoadingFolders);
  const selectedFolderId = useSelector(state => state.drive.selectedFolderId);
  const isAuthorized = useSelector(state => state.auth.isAuthorized);

  const currentParentId = useSelector(state => state.drive.currentParentId);
  const parentHistory = useSelector(state => state.drive.parentHistory);
  const nextFoldersPageToken = useSelector(state => state.drive.nextFoldersPageToken);

  const fetchFolders = async (parentId, pageToken = null, append = false, customTimeout = null) => {
    if (!window.electronAPI) return;

    if (!append) dispatch(setFolders({ folders: [], nextPageToken: null })); // clear before retry
    dispatch(setLoadingFolders(true));
    try {
      const data = await window.electronAPI.getFolders(parentId, pageToken, customTimeout);
      if (data.error) {
          if (data.errorCode === 'ETIMEDOUT' || data.errorCode === 'NETWORK_ERROR') {
              Toastify({
                  text: `<div style="display: flex; align-items: flex-start; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px; color: #EF4444; flex-shrink: 0; margin-top: 2px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><details style="max-width: 250px; flex-grow: 1;"><summary style="cursor: pointer; font-weight: bold; color: #111827; list-style: none; display: flex; align-items: center;">Network Error</summary><div style="margin-top: 8px; white-space: nowrap; overflow-x: auto; padding-bottom: 4px; color: #374151;">${data.error}</div></details></div>`,
                  escapeMarkup: false,
                  duration: 10000, // Increase duration so user has time to read accordion
                  close: true,
                  gravity: "bottom",
                  position: "right",
                  className: "error-toast"
              }).showToast();
          } else {
              dispatch(addNotification({ message: data.error, type: 'error' }));
          }
          return;
      }
      if (append) {
          dispatch(appendFolders(data));
      } else {
          dispatch(setFolders(data));
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      dispatch(addNotification({ message: "An unexpected error occurred while fetching folders.", type: 'error' }));
    } finally {
      dispatch(setLoadingFolders(false));
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchFolders(currentParentId);
    }
  }, [isAuthorized, currentParentId]);

  const handleFolderClick = (folder) => {
    dispatch(selectFolder(folder));
  };

  const handleDoubleClick = (folder) => {
      // Navigate into the folder
      dispatch(pushParentHistory(currentParentId));
      dispatch(setCurrentParentId(folder.id));
      dispatch(selectFolder({id: null})); // Clear selection when navigating
  };

  const handleUpDirectory = () => {
      dispatch(popParentHistory());
      dispatch(selectFolder({id: null}));
  };

  return (
    <div className="block bg-white rounded-lg shadow-sm dark:bg-gray-800 divide-y flex flex-col h-full">
      <div className="flex justify-between items-center px-6 py-2 bg-gray-50 dark:bg-gray-700">
        <p className="text-gray-900 dark:text-white">Folders</p>
        {parentHistory.length > 0 && (
           <button
             onClick={handleUpDirectory}
             className="ml-2 px-2 py-1 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
             title="Go Up"
           >
             <i className="fas fa-level-up-alt"></i>
           </button>
        )}
        <button
          onClick={() => fetchFolders(currentParentId, null, false, 5000)}
          data-testid="refresh-button"
          className="ml-2 px-2 py-1 flex items-center justify-center min-w-[32px] min-h-[28px] text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
          title="Refresh"
        >
          {isLoading ? (
            <Spinner className="h-4 w-4 text-blue-500" />
          ) : (
            <i className="fas fa-sync-alt"></i>
          )}
        </button>
      </div>
      <ul id="folder-list" className="overflow-y-auto select-none max-h-[calc(100vh-240px)] flex-1">
        {isLoading && folders.length === 0 ? (
           <li className="p-4 flex justify-center items-center">
             <Spinner className="h-8 w-8 text-blue-500" />
           </li>
        ) : folders.length === 0 ? (
           <li className="p-4 text-center text-gray-500">No folders found in this directory</li>
        ) : (
          <>
            {folders.map((folder) => (
              <li
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                onDoubleClick={() => handleDoubleClick(folder)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                  selectedFolderId === folder.id ? 'bg-blue-50 dark:bg-gray-700 font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <i className="fas fa-folder mr-3 text-gray-400 dark:text-gray-500"></i>
                  <span className="truncate" title={folder.name}>{folder.name}</span>
                </div>
              </li>
            ))}
            {nextFoldersPageToken && (
               <li
                 onClick={() => fetchFolders(currentParentId, nextFoldersPageToken, true)}
                 className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-center text-blue-500 text-sm"
               >
                 {isLoading ? 'Loading more...' : 'Load more folders'}
               </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
}

export default FolderList;
