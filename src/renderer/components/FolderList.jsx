import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFolders, selectFolder, setLoadingFolders } from '../store/driveSlice';

function FolderList() {
  const dispatch = useDispatch();
  const folders = useSelector(state => state.drive.folders);
  const isLoading = useSelector(state => state.drive.isLoadingFolders);
  const selectedFolderId = useSelector(state => state.drive.selectedFolderId);
  const isAuthorized = useSelector(state => state.auth.isAuthorized);

  const fetchFolders = async () => {
    if (!window.electronAPI) return;

    dispatch(setLoadingFolders(true));
    try {
      const data = await window.electronAPI.getFolders();
      // Assume getFolders returns an array of folder objects {id, name, ...}
      dispatch(setFolders(data || []));
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    } finally {
      dispatch(setLoadingFolders(false));
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchFolders();
    }
  }, [isAuthorized]);

  const handleFolderClick = (folder) => {
    dispatch(selectFolder(folder));
  };

  return (
    <div className="block bg-white rounded-lg shadow-sm dark:bg-gray-800 divide-y flex flex-col h-full">
      <div className="flex justify-between items-center px-6 py-2 bg-gray-50 dark:bg-gray-700">
        <p className="text-gray-900 dark:text-white">Folders</p>
        <button
          onClick={fetchFolders}
          data-testid="refresh-button"
          className="ml-2 px-2 py-1 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
          title="Refresh"
        >
          <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
        </button>
      </div>
      <ul id="folder-list" className="overflow-y-auto select-none max-h-[calc(100vh-240px)] flex-1">
        {isLoading && folders.length === 0 ? (
           <li className="p-4 text-center text-gray-500">Loading folders...</li>
        ) : folders.length === 0 ? (
           <li className="p-4 text-center text-gray-500">No folders found</li>
        ) : (
          folders.map((folder) => (
            <li
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${
                selectedFolderId === folder.id ? 'bg-blue-50 dark:bg-gray-700 font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <i className="fas fa-folder mr-3 text-gray-400 dark:text-gray-500"></i>
                <span className="truncate" title={folder.name}>{folder.name}</span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default FolderList;
