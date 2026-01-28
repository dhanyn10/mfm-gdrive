const Toastify = require('toastify-js');

/**
 * Displays a toast notification.
 * @param {string} text - The message to display.
 * @param {string} [type='info'] - The type of toast (e.g., 'success', 'error', 'info').
 */
function showToast(text, type = 'info') {
    const classMap = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-slate-700'
    };

    Toastify({
        text: text,
        duration: 5000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        className: `text-white px-4 py-2 rounded-md shadow-lg ${classMap[type] || classMap['info']}`,
    }).showToast();
}
/**
 * Creates a DOM element with specified attributes, class name, and children.
 * 
 * @param {string} elem - The type of element to create (e.g., 'div').
 * @param {Object} [options={}] - An object containing attributes and optional properties.
 * @param {string | null} [options.className] - List of classes for the element (optional).
 * @param {string | null} [options.innerHTML] - Any HTML inside the element (optional).
 * @param {string | Array} [options.child] - Children for the element, will be inserted based on its queue (optional).
 */
function elemFactory(
    elem,
    options = {}  // Default to an empty object
  ) {
    const factory = document.createElement(elem);

    // Set attributes
    Object.entries(options).forEach(([key, val]) => {
        factory.setAttribute(key, val)
    })

    // Set innerHTML if provided
    if (options.innerHTML) {
      factory.innerHTML = options.innerHTML
    }

    // Handle children
    if (options.child != null) {
        if (Array.isArray(options.child)) {
            options.child.forEach(c => {
                factory.appendChild(c)
            })
        } else {
            factory.appendChild(options.child)
        }
    }
    return factory;
}

/**
 * Pads numbers in a single filename based on the specified length.
 * @param {string} filename - The filename to process.
 * @param {number} padLength - Number of digits to pad the numbers to.
 * @returns {string} - The filename with the padded number.
 */
function padFilename(filename, padLength) {
  // Use regex to find any number in the filename
  return filename.replace(/(\D*?)(\d+)(.*)/, (_, prefix, num, suffix) => {
    // Pad the numeric part
    const paddedNum = num.padStart(parseInt(padLength), "0");
    // Return the updated filename
    return `${prefix}${paddedNum}${suffix}`;
  });
}

/**
 * Creates a span element with the filename, where each character is wrapped in a span.
 * This allows for individual character highlighting/styling.
 * @param {string} fileName - The name of the file.
 * @returns {HTMLElement} - The span element containing the filename.
 */
function createFileNameWithTooltips(fileName) {
  let fullFileName = document.createElement('span');
  fullFileName.className = "filename-wrapper"; // Class for easy selection
  
  // Split filename into characters and wrap each in a span
  [...fileName].forEach((char, index) => {
      let charSpan = document.createElement('span');
      charSpan.textContent = char;
      charSpan.className = "char-span transition-colors duration-150"; // Base class
      charSpan.dataset.index = index;
      fullFileName.appendChild(charSpan);
  });

  return fullFileName;
}

module.exports = {
  elemFactory,
  padFilename,
  createFileNameWithTooltips,
  showToast
};
