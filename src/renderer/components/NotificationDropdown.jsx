import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markAllNotificationsRead } from '../store/uiSlice';

function NotificationDropdown({ count }) {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useSelector(state => state.ui.notifications);
  const dispatch = useDispatch();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && count > 0) {
        dispatch(markAllNotificationsRead());
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative px-2 py-1 text-sm font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white z-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
          <div className="py-1">
            <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-600">
              <span>Notifications</span>
            </div>
            <div className="max-h-60 overflow-y-auto pt-2">
              {notifications.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm p-4">No new notifications.</p>
              ) : (
                notifications.map((notif, idx) => (
                  <div key={idx} className={`p-3 text-sm border-b border-gray-100 dark:border-gray-600 ${notif.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}`}>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                      <span className="text-gray-800 dark:text-gray-200 flex-1">{notif.message}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block ml-4">{notif.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;