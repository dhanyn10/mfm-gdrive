import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab, setExecuteSidebarOpen } from '../store/uiSlice';
import NotificationDropdown from './NotificationDropdown';

function Navigation() {
  const dispatch = useDispatch();
  const activeTab = useSelector(state => state.ui.activeTab);
  const isExecuteSidebarOpen = useSelector(state => state.ui.isExecuteSidebarOpen);
  const unreadCount = useSelector(state => state.ui.unreadCount);
  const selectedFileIds = useSelector(state => state.drive.selectedFileIds);

  const handleTabClick = (tab) => {
    dispatch(setActiveTab(tab));
    if (tab === 'execute') {
      dispatch(setExecuteSidebarOpen(true));
    } else {
      dispatch(setExecuteSidebarOpen(false));
    }
  };

  const hasSelections = selectedFileIds.length > 0;

  return (
    <nav className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 mb-4 flex-none">
      <div className="container mx-auto flex items-center p-4 relative">
        <div className="flex-grow flex justify-center">
          <div className="inline-flex rounded-md" role="group">
            <button
              onClick={() => handleTabClick('folders')}
              type="button"
              className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-s-lg focus:z-10 dark:border-gray-600 ${
                activeTab === 'folders'
                  ? 'text-blue-700 bg-gray-100 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              }`}
            >
              Folders
            </button>
            <button
              onClick={() => handleTabClick('files')}
              type="button"
              className={`px-4 py-2 text-sm font-medium border-t border-b border-gray-200 focus:z-10 dark:border-gray-600 ${
                activeTab === 'files'
                  ? 'text-blue-700 bg-gray-100 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => handleTabClick('execute')}
              type="button"
              disabled={!hasSelections}
              className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-e-lg focus:z-10 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed ${
                isExecuteSidebarOpen
                  ? 'text-blue-700 bg-gray-100 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-900 bg-white hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
              }`}
            >
              Execute
            </button>
          </div>
        </div>

        <div className="absolute right-4">
          <NotificationDropdown count={unreadCount} />
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
