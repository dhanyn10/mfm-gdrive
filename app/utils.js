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
 * Creates a span element with the filename where each character has a tooltip showing its index.
 * @param {string} fileName - The name of the file.
 * @returns {HTMLElement} - The span element containing the filename with tooltips.
 */
function createFileNameWithTooltips(fileName) {
  let fullFileName = document.createElement('span');
  for (let j = 0; j < fileName.length; j++) {
    let fullCharTooltip = elemFactory('span', {"class": "relative group"});
    let spanChar = elemFactory('span', {"class": "hover:ring ring-blue-200"});
    let charNumTooltip = elemFactory("span", {"class":
      "absolute left-1/2 transform -translate-x-1/2 top-[-25px] w-max \
      px-2 py-1 text-sm text-white bg-black rounded opacity-0 group-hover:opacity-100 \
      transition-opacity duration-300"});

    spanChar.innerHTML = fileName.charAt(j) === " " ? "&nbsp;" : fileName.charAt(j);
    spanChar.classList.add('font-mono', 'whitespace-normal');
    charNumTooltip.innerHTML = j + 1;

    fullCharTooltip.appendChild(spanChar);
    fullCharTooltip.appendChild(charNumTooltip);
    fullFileName.appendChild(fullCharTooltip);
  }
  return fullFileName;
}

module.exports = {
  elemFactory,
  padFilename,
  createFileNameWithTooltips,
  showToast
};
