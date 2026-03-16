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

  const fetchFolders = async (parentId, pageToken = null, append = false) => {
    if (!window.electronAPI) return;

    dispatch(setLoadingFolders(true));
    try {
      const data = await window.electronAPI.getFolders(parentId, pageToken);
      if (data.error) {
          if (data.errorCode === 'ETIMEDOUT' || data.errorCode === 'NETWORK_ERROR') {
              Toastify({
                  text: data.error,
                  duration: 5000,
                  close: true,
                  gravity: "bottom",
                  position: "right",
                  style: {
                      background: "#EF4444",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      maxWidth: "300px",
                      fontSize: "14px",
                      padding: "10px 15px",
                      overflowX: "auto",
                      whiteSpace: "nowrap"
                  }
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
          onClick={() => fetchFolders(currentParentId)}
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
