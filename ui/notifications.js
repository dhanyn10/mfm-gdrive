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
        notifications.forEach(notif => {
            const item = elemFactory('div', {
                class: `p-4 text-sm ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200 bg-blue-50 dark:bg-gray-600'} border-b border-gray-200 dark:border-gray-600`
            });
            const iconClass = {
                success: 'fas fa-check-circle text-green-500',
                error: 'fas fa-times-circle text-red-500',
                info: 'fas fa-info-circle text-blue-500'
            }[notif.type];

            item.innerHTML = `<i class="${iconClass} mr-2"></i> ${notif.text}`;
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

function addNotification(text, type = 'info') {
    const newNotification = {
        text,
        type,
        read: false,
        timestamp: new Date()
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
    notificationBell.addEventListener('click', () => {
        notificationDropdown.classList.toggle('hidden');
        if (!notificationDropdown.classList.contains('hidden')) {
            // When opening the dropdown, mark items as read after a short delay
            setTimeout(() => {
                markAllAsRead();
            }, 1500);
        }
    });

    markAllReadButton.addEventListener('click', () => {
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
