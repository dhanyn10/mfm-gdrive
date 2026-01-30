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
            // Card style with soft shadow instead of border
            const item = elemFactory('div', {
                class: `flex items-center p-3 mb-2 mx-2 rounded-lg shadow-sm text-sm ${notif.read ? 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-blue-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`
            });
            
            const iconClass = {
                success: 'fas fa-check-circle text-green-500',
                error: 'fas fa-times-circle text-red-500',
                info: 'fas fa-info-circle text-blue-500'
            }[notif.type];

            item.innerHTML = `<i class="${iconClass} mr-3 text-lg"></i> <span>${notif.text}</span>`;
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
