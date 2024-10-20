// utility
/**
 * Creates a DOM element with specified attributes, class name, and children.
 * 
 * @param {string} elem - The type of element to create (e.g., 'div').
 * @param {Object} [options={}] - An object containing attributes and optional properties.
 * @param {string | null} [options.className] - List of classes for the element (optional).
 * @param {string | null} [options.innerHTML] - Any HTML inside the element (optional).
 * @param {string | Array} [options.child] - Children for the element, will be inserted based on its queue (optional).
 */
export function elemFactory(
    elem,
    options = {}  // Default to an empty object
  ) {
    const factory = document.createElement(elem);

    // Set attributes
    Object.entries(options).forEach(([key, val]) => {
      if (key === 'className') {
        factory.className = val;  // Handle className separately
      } else {
        factory.setAttribute(key, val);
      }
    });

    // Set innerHTML if provided
    if (options.innerHTML) {
      factory.innerHTML = options.innerHTML;
    }

    // Handle children
    if (options.child != null) {
        if (Array.isArray(options.child)) {
            options.child.forEach(c => {
                factory.appendChild(c);
            });
        } else {
            factory.appendChild(options.child);
        }
    }
    return factory;
}
  