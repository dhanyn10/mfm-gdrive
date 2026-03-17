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
import { toggleExecute, addNotification } from '../store/uiSlice';
import { showToast } from '../utils/toast';
import { Spinner } from './common/Spinner';

import { RootState } from '../store/store';

function FileList() {
  const dispatch = useDispatch();
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);
  const selectedFolderId = useSelector((state: RootState) => state.drive.selectedFolderId);

  const files = useSelector((state: RootState) => state.drive.files);
  const nextFilesPageToken = useSelector((state: RootState) => state.drive.nextFilesPageToken);

  const isLoading = useSelector((state: RootState) => state.drive.isLoadingFiles);
  const selectedFileIds = useSelector((state: RootState) => state.drive.selectedFileIds);
  const currentPage = useSelector((state: RootState) => state.drive.currentPage);
  const itemsPerPage = useSelector((state: RootState) => state.drive.itemsPerPage);
  const refreshTrigger = useSelector((state: RootState) => state.drive.refreshTrigger);
  const slicePreview = useSelector((state: RootState) => state.ui.slicePreview);
  const operationPreview = useSelector((state: RootState) => state.ui.operationPreview);
  const isNotificationDropdownOpen = useSelector((state: RootState) => state.ui.isNotificationDropdownOpen);
  const hoveredFileId = useSelector((state: RootState) => state.ui.hoveredFileId);

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
    currentFiles.every((file: any) => selectedFileIds.includes(file.id));

  const hasSelections = selectedFileIds.length > 0;

  // Replicate logic from src/main/fileOperations.js for previewing
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const getPreviewName = (originalName: string) => {
    if (!operationPreview.active) return originalName;
    const { type, params } = operationPreview;

    if (type === 'replace') {
      if (!params.search) return originalName;
      try {
        const regex = new RegExp(escapeRegExp(params.search), 'g');
        return originalName.replace(regex, params.replace || '');
      } catch (e) {
        return originalName;
      }
    } else if (type === 'slice') {
      const { start, end } = params;
      if (start === undefined || start === null) return originalName;
      if (end === undefined || end === null) {
        return originalName.slice(0, start);
      }
      return originalName.slice(0, start) + originalName.slice(end);
    } else if (type === 'pad') {
      const { count, char, position } = params;
      if (!count || !char) return originalName;
      return originalName.replace(/\d+/, (match: string) => {
        if (match.length >= count) return match;
        if (position === 'start') {
          return match.padStart(count, char);
        } else {
          return match.padEnd(count, char);
        }
      });
    }

    return originalName;
  };

  const fetchFiles = async (folderId: string, pageToken: string | null = null, append = false, customTimeout: number | null = null) => {
    if (!(window as any).electronAPI) return;
    if (!append) dispatch(setFiles({ files: [], nextPageToken: null })); // clear before retry
    dispatch(setLoadingFiles(true));
    try {
      // Create a local timeout fallback for the spinner of 10s max
      const timeoutFallback = new Promise<any>(resolve => {
        setTimeout(() => {
          resolve({ error: "Request timed out", errorCode: "ETIMEDOUT" });
        }, 10000);
      });

      const fetchPromise = ((window as any).electronAPI as any).getFiles(folderId, pageToken, customTimeout);
      const data = await Promise.race([fetchPromise, timeoutFallback]);
      if (data.error) {
          if (data.errorCode === 'ETIMEDOUT' || data.errorCode === 'NETWORK_ERROR') {
              showToast({
                  text: `<div style="display: flex; align-items: flex-start; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px; color: #EF4444; flex-shrink: 0; margin-top: 2px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><details style="max-width: 250px; flex-grow: 1;"><summary style="cursor: pointer; font-weight: bold; color: #111827; list-style: none; display: flex; align-items: center;">Network Error</summary><div style="margin-top: 8px; white-space: nowrap; overflow-x: auto; padding-bottom: 4px; color: #374151;">${data.error}</div></details></div>`,
                  escapeMarkup: false,
                  duration: 10000, // Increase duration so user has time to read accordion
                  close: true,
                  gravity: "bottom",
                  position: "right",
                  className: "error-toast"
              });
          } else {
              dispatch(addNotification({ message: data.error, type: 'error' }));
          }
          return;
      }
      if (append) {
          dispatch(appendFiles(data));
      } else {
          dispatch(setFiles(data));
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
      dispatch(addNotification({ message: "An unexpected error occurred while fetching files.", type: 'error' }));
    } finally {
      dispatch(setLoadingFiles(false));
    }
  };

  useEffect(() => {
    if (selectedFolderId) {
       // Only fetch if it's a folder change or regular refresh,
       // but don't apply custom timeout automatically here
       fetchFiles(selectedFolderId);
    }
  }, [selectedFolderId, refreshTrigger, dispatch]);

  const handleLoadMore = () => {
      if (nextFilesPageToken && selectedFolderId) {
          fetchFiles(selectedFolderId, nextFilesPageToken, true);
      }
  };

  const handleSelectAll = () => {
    const pageIds = currentFiles.map((f: any) => f.id);
    dispatch(selectAllFilesOnPage(pageIds));
  };

  const handleSelectNone = () => {
    dispatch(clearAllSelections());
  };

  const handleFileClick = (e: any, index: number, fileId: string) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click logic
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeFiles = currentFiles.slice(start, end + 1);
      const rangeFileIds = rangeFiles.map((f: any) => f.id);
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
          {hasSelections && (
            <button
              onClick={() => dispatch(toggleExecute())}
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-700 border border-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
              Next
            </button>
          )}
        </div>
      )}

      {/* File List Area */}
      <div className="w-full flex-1 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Spinner className="h-8 w-8 text-blue-500" />
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No files found in this folder</div>
        ) : (
          <ul className="overflow-y-auto h-full divide-y divide-gray-100 dark:divide-gray-700">
            {currentFiles.map((file: any, index: number) => {
              const actuallySelected = selectedFileIds.includes(file.id);
              const isSelected = !isNotificationDropdownOpen && actuallySelected;
              const isHoveredNotif = isNotificationDropdownOpen && file.id === hoveredFileId;

              const previewName = actuallySelected && operationPreview.active ? getPreviewName(file.name) : null;
              const hasPreview = previewName !== null && previewName !== file.name;

              // Base background styling logic
              let liClass = "flex flex-col p-3 select-none cursor-pointer w-full relative ";
              if (isSelected && !hasPreview) {
                liClass += "bg-blue-300 hover:bg-blue-400 dark:bg-gray-700 dark:hover:bg-gray-600";
              } else if (isHoveredNotif) {
                liClass += "bg-gray-50 dark:bg-gray-700";
              } else {
                liClass += "hover:bg-gray-50 dark:hover:bg-gray-700";
              }

              return (
                <li
                  key={file.id}
                  onClick={(e) => handleFileClick(e, index, file.id)}
                  className={liClass}
                >
                  <div className="flex items-center w-full">
                    <div className="flex items-center h-5 hidden">
                      <input
                        type="checkbox"
                        checked={actuallySelected}
                        onChange={(e) => handleFileClick(e.nativeEvent, index, file.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="ms-3 text-sm flex-1 min-w-0">
                      {slicePreview.active && slicePreview.start !== undefined && isSelected ? (
                        <span
                          className="font-medium text-gray-900 dark:text-gray-300 flex flex-row items-stretch flex-nowrap overflow-hidden min-w-0"
                          style={{ height: '1.25em', lineHeight: 1.25 }}
                        >
                          {[...file.name].map((char, i) => {
                            const inRange = i >= slicePreview.start && i < slicePreview.end;
                            return (
                              <React.Fragment key={i}>
                                {i === slicePreview.start && (
                                  <span className="w-0.5 shrink-0 bg-blue-500 mx-px self-stretch" title="Start" aria-hidden />
                                )}
                                {i === slicePreview.end && slicePreview.end !== slicePreview.start && (
                                  <span className="w-0.5 shrink-0 bg-amber-500 mx-px self-stretch" title="End" aria-hidden />
                                )}
                                {inRange ? (
                                  <span className="bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 flex items-center justify-center shrink-0">{char === ' ' ? '\u00A0' : char}</span>
                                ) : (
                                  <span className="flex items-center justify-center shrink-0">{char === ' ' ? '\u00A0' : char}</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {file.name.length === slicePreview.end && slicePreview.end !== slicePreview.start && (
                            <span className="w-0.5 shrink-0 bg-amber-500 mx-px self-stretch" title="End" aria-hidden />
                          )}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-gray-300 block truncate">
                          {file.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasPreview && (
                    <>
                      <div className="ms-3 mt-1 text-sm flex-1 min-w-0">
                        <span className="font-medium text-green-600 dark:text-green-500 block truncate">
                          {previewName}
                        </span>
                      </div>
                      <span className="absolute top-2 right-3 text-xs text-gray-400 dark:text-gray-500 italic">
                        preview
                      </span>
                    </>
                  )}
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
