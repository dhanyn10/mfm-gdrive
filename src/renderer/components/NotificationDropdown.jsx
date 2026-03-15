import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { markAllNotificationsRead, removeNotification } from '../store/uiSlice';

function NotificationDropdown({ count }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});
  const [swipingOutId, setSwipingOutId] = useState(null);
  const notifications = useSelector(state => state.ui.notifications);
  const dispatch = useDispatch();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && count > 0) {
        dispatch(markAllNotificationsRead());
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUndo = async (e, notifId, fileId, oldName) => {
    e.stopPropagation();
    if (window.electronAPI && window.electronAPI.undoRename) {
       const success = await window.electronAPI.undoRename(fileId, oldName);
       if (success) {
           setSwipingOutId(notifId);
           setTimeout(() => {
               dispatch(removeNotification(notifId));
               setSwipingOutId(null);
           }, 300);
       }
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
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 text-sm border-b border-gray-100 dark:border-gray-600 ${notif.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'} ${notif.details ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''} transition-all duration-300 transform ${swipingOutId === notif.id ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
                    onClick={() => notif.details && toggleExpand(notif.id)}
                  >
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${notif.type === 'success' ? 'bg-green-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                      <span className="text-gray-800 dark:text-gray-200 flex-1">{notif.message}</span>
                      {notif.details && (
                        <>
                          <i className={`fas fa-chevron-${expandedIds[notif.id] ? 'up' : 'down'} text-gray-400 ml-2 hover:text-gray-600`}></i>
                          {notif.fileId && (
                            <i
                              className="fas fa-rotate-left text-gray-400 ml-3 hover:text-blue-500 cursor-pointer"
                              title="Undo Rename"
                              onClick={(e) => handleUndo(e, notif.id, notif.fileId, notif.details)}
                            ></i>
                          )}
                        </>
                      )}
                    </div>
                    {expandedIds[notif.id] && notif.details && (
                       <div className="mt-2 ml-4 p-2 bg-gray-200 dark:bg-gray-900 rounded text-gray-700 dark:text-gray-300 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" title={notif.details}>
                         {notif.details}
                       </div>
                    )}
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