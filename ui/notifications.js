// ui/notifications.js
const { elemFactory } = require('../utils');

const notifications = [];
let unreadCount = 0;

const notificationBell = document.getElementById('notification-bell');
const notificationDropdown = document.getElementById('notification-dropdown');
const notificationList = document.getElementById('notification-list');
const notificationCountBadge = document.getElementById('notification-count');
const noNotificationsMessage = document.getElementById('no-notifications-message');
const markAllReadButton = document.getElementById('mark-all-read');

function renderNotifications() {
    notificationList.innerHTML = '';
    if (notifications.length === 0) {
        noNotificationsMessage.classList.remove('hidden');
        markAllReadButton.classList.add('hidden');
    } else {
        noNotificationsMessage.classList.add('hidden');
        markAllReadButton.classList.remove('hidden');
        notifications.forEach((notif) => {
            const item = elemFactory('div', {
                class: `flex items-center justify-between p-3 text-sm border-b border-gray-200 dark:border-gray-600 cursor-pointer transition-colors duration-200 ${notif.read ? 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800' : 'text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-gray-600'}`
            });
            
            const iconBase = {
                success: 'fas fa-check-circle',
                error: 'fas fa-times-circle',
                info: 'fas fa-info-circle'
            }[notif.type];

            const iconColor = notif.read ? 'text-gray-300 dark:text-gray-600' : {
                success: 'text-green-500',
                error: 'text-red-500',
                info: 'text-blue-500'
            }[notif.type];

            const contentWrapper = elemFactory('div', { class: 'flex items-center flex-grow' });
            contentWrapper.innerHTML = `<i class="${iconBase} ${iconColor} mr-3 text-lg"></i> <span>${notif.text}</span>`;
            item.appendChild(contentWrapper);

            if (notif.undoFunction && !notif.read) {
                const undoButton = elemFactory('button', {
                    class: 'ml-2 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-150 shadow-sm',
                    innerHTML: 'Undo'
                });
                undoButton.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Prevent marking as read immediately or closing dropdown
                    try {
                        await notif.undoFunction();
                        
                        // Find the current index of this notification object
                        const currentIndex = notifications.indexOf(notif);
                        if (currentIndex > -1) {
                            notifications.splice(currentIndex, 1);
                            // Only decrement unreadCount if the item was unread (which it should be, given the condition above)
                            if (!notif.read) {
                                unreadCount--;
                            }
                            renderNotifications();
                        }
                    } catch (error) {
                        console.error("Undo failed", error);
                    }
                });
                item.appendChild(undoButton);
            }
            
            // Click to mark as read
            item.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if (!notif.read) {
                    notif.read = true;
                    unreadCount--;
                    renderNotifications();
                }
            });

            if (notif.relatedFileId) {
                item.addEventListener('mouseenter', () => {
                    const checkbox = document.querySelector(`input.cbox-file-folder[value="${notif.relatedFileId}"]`);
                    if (checkbox) {
                        const span = checkbox.nextElementSibling;
                        if (span) {
                            span.classList.add('bg-gray-100');
                            span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                });
                item.addEventListener('mouseleave', () => {
                    const checkbox = document.querySelector(`input.cbox-file-folder[value="${notif.relatedFileId}"]`);
                    if (checkbox) {
                        const span = checkbox.nextElementSibling;
                        if (span) {
                            span.classList.remove('bg-gray-100');
                        }
                    }
                });
            }

            notificationList.appendChild(item);
        });
    }
    notificationCountBadge.textContent = unreadCount;
    if (unreadCount > 0) {
        notificationCountBadge.classList.remove('hidden');
    } else {
        notificationCountBadge.classList.add('hidden');
    }
}

function addNotification(text, type = 'info', relatedFileId = null, undoFunction = null) {
    const newNotification = {
        text,
        type,
        relatedFileId,
        undoFunction,
        read: false
    };
    notifications.unshift(newNotification);
    unreadCount++;
    renderNotifications();
}

function markAllAsRead() {
    notifications.forEach(notif => {
        notif.read = true;
    });
    unreadCount = 0;
    renderNotifications();
}

function setupNotificationBell() {
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
    });

    markAllReadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        markAllAsRead();
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!notificationBell.contains(event.target) && !notificationDropdown.contains(event.target)) {
            notificationDropdown.classList.add('hidden');
        }
    });
}

module.exports = {
    addNotification,
    setupNotificationBell
};
