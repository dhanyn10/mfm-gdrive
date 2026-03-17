import Toastify from 'toastify-js';

const MAX_TOASTS = 4;
let activeToasts: any[] = [];

export function showToast(options: any) {
    const toastInstance = Toastify({
        ...options,
        callback: function() {
            // Remove from active array when it closes naturally
            activeToasts = activeToasts.filter(t => t !== toastInstance);
            if (options.callback) options.callback();
        }
    });

    toastInstance.showToast();
    activeToasts.push(toastInstance);

    // If we exceed MAX_TOASTS, remove the oldest one
    if (activeToasts.length > MAX_TOASTS) {
        const oldestToast = activeToasts.shift();
        // Since toastify-js doesn't have a public hide() API that's easily exposed,
        // we can find the element and remove it, or simulate a click on the close button.
        // Wait, toastInstance.hideToast() exists in recent versions of toastify-js. Let's try it.
        if (typeof oldestToast.hideToast === 'function') {
             oldestToast.hideToast();
        } else if (oldestToast.toastElement) {
             oldestToast.toastElement.remove();
        }
    }

    return toastInstance;
}
