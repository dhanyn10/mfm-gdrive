const Toastify = require('toastify-js');

/**
 * Displays a toast notification using the Toastify library.
 * @param {string} text - The message to display in the toast.
 * @param {('success'|'error'|'info')} [type='info'] - The type of toast, which determines its background color.
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
 * A factory function to create DOM elements with specified attributes and children.
 * @param {string} elem - The tag name of the element to create (e.g., 'div', 'span').
 * @param {object} [options={}] - An object containing attributes and properties for the element.
 * @param {string} [options.innerHTML] - HTML content to set for the element.
 * @param {HTMLElement|Array<HTMLElement>} [options.child] - A single child or an array of children to append.
 * @param {...any} - Any other key-value pairs in options will be set as attributes on the element.
 * @returns {HTMLElement} The newly created DOM element.
 */
function elemFactory(elem, options = {}) {
    const factory = document.createElement(elem);

    // Set attributes from the options object.
    for (const [key, val] of Object.entries(options)) {
        if (key !== 'innerHTML' && key !== 'child') {
            factory.setAttribute(key, val);
        }
    }

    // Set innerHTML if provided.
    if (options.innerHTML) {
        factory.innerHTML = options.innerHTML;
    }

    // Append children if provided.
    if (options.child) {
        if (Array.isArray(options.child)) {
            options.child.forEach(c => factory.appendChild(c));
        } else {
            factory.appendChild(options.child);
        }
    }
    
    return factory;
}

/**
 * Pads the first sequence of digits found in a filename with leading zeros.
 * @param {string} filename - The filename to process.
 * @param {number} padLength - The desired total length of the numeric part.
 * @returns {string} The filename with the padded number, or the original filename if no number is found.
 */
function padFilename(filename, padLength) {
    // This regex finds the first number in the filename and captures the prefix, number, and suffix.
    return filename.replace(/(\D*?)(\d+)(.*)/, (_, prefix, num, suffix) => {
        const paddedNum = num.padStart(parseInt(padLength), "0");
        return `${prefix}${paddedNum}${suffix}`;
    });
}

/**
 * Creates a container element for a filename where each character is wrapped in its own span.
 * This is used for detailed styling, like highlighting parts of the filename.
 * @param {string} fileName - The name of the file.
 * @returns {HTMLElement} A span element containing the character-wrapped filename.
 */
function createFileNameWithTooltips(fileName) {
    const fullFileName = document.createElement('span');
    fullFileName.className = "filename-wrapper"; // A class for easy selection.
  
    // Split the filename into characters and wrap each in a span.
    [...fileName].forEach((char, index) => {
        const charSpan = document.createElement('span');
        charSpan.textContent = char;
        charSpan.className = "char-span transition-colors duration-150"; // Base class for styling.
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
