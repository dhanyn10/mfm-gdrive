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
 * Generates a pagination element based on the total pages and current page.
 * 
 * @param {number} totalPages - The total number of pages.
 * @param {number} currentPage - The current active page.
 * @param {function} onPageChange - A callback function to handle page change.
 * @returns {HTMLElement} The pagination DOM element.
 */
export function generatePaging(totalPages, currentPage, onPageChange) {
    // Create a container for the pagination
    const pagination = elemFactory('div', {
        className: 'flex items-center space-x-2'
    });

    // Generate previous page button
    const prevButton = elemFactory('button', {
        className: `px-3 py-1 rounded-lg text-sm ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`,
        innerHTML: '&laquo;', // HTML entity for left arrow
    });
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
        onPageChange(currentPage - 1);
        }
    });

    // Append the previous button
    pagination.appendChild(prevButton);

    // Generate page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = elemFactory('button', {
        className: `px-3 py-1 rounded-lg text-sm ${currentPage === i ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 hover:bg-blue-100'}`,
        innerHTML: i.toString(),
        });
        pageButton.addEventListener('click', () => onPageChange(i));
        pagination.appendChild(pageButton);
    }

    // Generate next page button
    const nextButton = elemFactory('button', {
        className: `px-3 py-1 rounded-lg text-sm ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`,
        innerHTML: '&raquo;', // HTML entity for right arrow
    });
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
        }
    });

    // Append the next button
    pagination.appendChild(nextButton);

    return pagination;
}