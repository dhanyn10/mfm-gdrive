import Toastify from 'toastify-js';
import { createRoot } from 'react-dom/client';

const MAX_TOASTS = 4;
let activeToasts = [];

/**
 * Enhanced Toastify utility that supports React components.
 * @param {Object} options - Toastify options, plus an optional 'component' prop.
 */
export function showToast(options) {
    const { component, ...rest } = options;
    let toastNode = null;
    let reactRoot = null;

    if (component) {
        toastNode = document.createElement('div');
        reactRoot = createRoot(toastNode);
        reactRoot.render(component);
        // Toastify-js 'node' option will override 'text'
        rest.node = toastNode;
    }

    const toastInstance = Toastify({
        ...rest,
        callback: function() {
            // Clean up React root when toast is dismissed
            if (reactRoot) {
                // Short timeout to allow any CSS transitions to finish before unmounting
                setTimeout(() => {
                    try {
                        reactRoot.unmount();
                    } catch (e) {
                         // Already unmounted or other cleanup issues
                    }
                }, 300);
            }
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
        if (typeof oldestToast.hideToast === 'function') {
             oldestToast.hideToast();
        } else if (oldestToast.toastElement) {
             oldestToast.toastElement.remove();
        }
    }

    return toastInstance;
}
