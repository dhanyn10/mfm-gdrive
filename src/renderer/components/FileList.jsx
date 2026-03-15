import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLoadingFiles,
  setFiles,
  appendFiles,
  toggleFileSelection,
  selectAllFilesOnPage,
  selectFileRange,
  clearAllSelections,
  setPage
} from '../store/driveSlice';

function FileList() {
  const dispatch = useDispatch();
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState(null);
  const selectedFolderId = useSelector(state => state.drive.selectedFolderId);

  const files = useSelector(state => state.drive.files);
  const nextFilesPageToken = useSelector(state => state.drive.nextFilesPageToken);

  const isLoading = useSelector(state => state.drive.isLoadingFiles);
  const selectedFileIds = useSelector(state => state.drive.selectedFileIds);
  const currentPage = useSelector(state => state.drive.currentPage);
  const itemsPerPage = useSelector(state => state.drive.itemsPerPage);

  const totalPages = Math.ceil(files.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, files.length);
  const currentFiles = files.slice(startIndex, endIndex);

  // Reset last selected index when changing pages or folders
  useEffect(() => {
    setLastSelectedIndex(null);
  }, [currentPage, selectedFolderId]);

  // Determine if all items on the *current page* are selected
  const allCurrentPageSelected = currentFiles.length > 0 &&
    currentFiles.every(file => selectedFileIds.includes(file.id));

  const hasSelections = selectedFileIds.length > 0;

  const fetchFiles = async (folderId, pageToken = null, append = false) => {
    if (!window.electronAPI) return;
    dispatch(setLoadingFiles(true));
    try {
      const data = await window.electronAPI.getFiles(folderId, pageToken);
      if (append) {
          dispatch(appendFiles(data));
      } else {
          dispatch(setFiles(data));
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      dispatch(setLoadingFiles(false));
    }
  };

  useEffect(() => {
    if (selectedFolderId) {
       fetchFiles(selectedFolderId);
    }
  }, [selectedFolderId, dispatch]);

  const handleLoadMore = () => {
      if (nextFilesPageToken) {
          fetchFiles(selectedFolderId, nextFilesPageToken, true);
      }
  };

  const handleSelectAll = () => {
    const pageIds = currentFiles.map(f => f.id);
    dispatch(selectAllFilesOnPage(pageIds));
  };

  const handleSelectNone = () => {
    dispatch(clearAllSelections());
  };

  const handleFileClick = (e, index, fileId) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click logic
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeFiles = currentFiles.slice(start, end + 1);
      const rangeFileIds = rangeFiles.map(f => f.id);
      dispatch(selectFileRange(rangeFileIds));
    } else {
      // Normal click logic
      dispatch(toggleFileSelection(fileId));
      setLastSelectedIndex(index);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) dispatch(setPage(currentPage + 1));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) dispatch(setPage(currentPage - 1));
  };

  if (!selectedFolderId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <i className="fab fa-google-drive fa-5x mb-4 opacity-50"></i>
        <p>Select a folder to view files</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Selection Control Block */}
      {files.length > 0 && (
        <div className="mb-2 p-3 bg-white rounded-md border border-gray-200 dark:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              <i className="far fa-check-square mr-2"></i>
              Select All
            </button>
            {hasSelections && (
              <button
                onClick={handleSelectNone}
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                <i className="far fa-minus-square mr-2"></i>
                Select None
              </button>
            )}
          </div>
        </div>
      )}

      {/* File List Area */}
      <div className="w-full flex-1 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col">
        {isLoading && files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No files found in this folder</div>
        ) : (
          <ul className="overflow-y-auto h-full divide-y divide-gray-100 dark:divide-gray-700">
            {currentFiles.map((file, index) => {
              const isSelected = selectedFileIds.includes(file.id);
              return (
                <li
                  key={file.id}
                  className={`flex items-center p-3 select-none ${isSelected ? 'bg-blue-300 hover:bg-blue-400 dark:bg-gray-700 dark:hover:bg-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <div className="flex items-center h-5 hidden">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleFileClick(e.nativeEvent, index, file.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ms-3 text-sm flex-1 cursor-pointer" onClick={(e) => handleFileClick(e, index, file.id)}>
                    <label
                      className="font-medium text-gray-900 dark:text-gray-300 cursor-pointer pointer-events-none"
                    >
                      {file.name}
                    </label>
                  </div>
                </li>
              );
            })}

            {/* Server-side load more indicator */}
            {nextFilesPageToken && (
               <li
                 onClick={handleLoadMore}
                 className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-center text-blue-500 text-sm"
               >
                 {isLoading ? 'Loading more from Google Drive...' : 'Load more files'}
               </li>
            )}
          </ul>
        )}
      </div>

      {/* Pagination Controls */}
      {files.length > 0 && (
        <div className="mt-2 mb-4 flex items-center justify-between flex-none">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="w-3.5 h-3.5 me-2 rtl:rotate-180" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5H1m0 0 4 4M1 5l4-4"/>
            </svg>
            Previous
          </button>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages || 1} ({files.length} items)
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Next
            <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default FileList;
