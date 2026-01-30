// ui.js

/**
 * This file serves as a central hub for all UI-related modules.
 * It imports functions from various sub-modules (components, panels, buttons, helpers)
 * and exports them as a single, cohesive unit. This pattern helps in organizing
 * the UI code and makes it easier to import UI functions where needed.
 */

const components = require('./ui/components');
const panels = require('./ui/panels');
const buttons = require('./ui/buttons');
const helpers = require('./ui/helpers');
const notifications = require('./ui/notifications');

// Export all functions from the imported UI modules.
// The spread syntax (...) is used to merge the exports from each module
// into a single object.
module.exports = {
    ...components,
    ...panels,
    ...buttons,
    ...helpers,
    ...notifications,
    // Explicitly exporting updatePreviewCard to ensure it's available,
    // though it should already be included via the spread of `components`.
    // This might be redundant but doesn't cause harm.
    updatePreviewCard: components.updatePreviewCard
};
