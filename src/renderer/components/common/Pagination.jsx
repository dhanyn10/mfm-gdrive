import React from 'react';

/**
 * Pagination component for navigating through file pages.
 * @param {Object} props
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {function} props.onPageChange
 */
function Pagination({ currentPage, totalPages, onPageChange }) {
  /**
   * Generates the array of page numbers and ellipses based on the current state.
   */
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Near start: 1, 2, 3, 4, 5, ..., total
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    // Near end: 1, ..., total-4, total-3, total-2, total-1, total
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    // Middle: 1, ..., cur-1, cur, cur+1, ..., total
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handlePrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="mt-2 mb-4 flex items-center justify-between flex-none">
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        type="button"
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        <svg className="w-3.5 h-3.5 me-2 rtl:rotate-180" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5H1m0 0 4 4M1 5l4-4"/>
        </svg>
        Previous
      </button>

      <div className="flex space-x-1">
        {getPageNumbers().map((page, index) => {
          const isCurrent = page === currentPage;
          const isEllipsis = page === '...';
          
          let btnClass = "px-3 py-2 text-sm font-medium rounded-lg ";
          if (isCurrent) {
            btnClass += "bg-blue-600 text-white dark:bg-blue-500";
          } else if (isEllipsis) {
            btnClass += "bg-transparent text-gray-500 cursor-default";
          } else {
            btnClass += "bg-white text-gray-900 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700";
          }

          return (
            <button
              key={`${page}-${index}`}
              onClick={() => !isEllipsis && onPageChange(Number(page))}
              disabled={isEllipsis}
              type="button"
              className={btnClass}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
        type="button"
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        Next
        <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
        </svg>
      </button>
    </div>
  );
}

export default Pagination;

