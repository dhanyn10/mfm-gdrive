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
      return Array.from({ length: totalPages }, (_, i) => ({ value: i + 1, id: `page-${i + 1}` }));
    }
    
    if (currentPage <= 4) {
      return [
        ...Array.from({ length: 5 }, (_, i) => ({ value: i + 1, id: `page-${i + 1}` })),
        { value: '...', id: 'ellipsis-end' },
        { value: totalPages, id: `page-${totalPages}` }
      ];
    }
    
    if (currentPage >= totalPages - 3) {
      return [
        { value: 1, id: 'page-1' },
        { value: '...', id: 'ellipsis-start' },
        ...Array.from({ length: 5 }, (_, i) => {
          const val = totalPages - 4 + i;
          return { value: val, id: `page-${val}` };
        })
      ];
    }
    
    return [
      { value: 1, id: 'page-1' },
      { value: '...', id: 'ellipsis-start' },
      { value: currentPage - 1, id: `page-${currentPage - 1}` },
      { value: currentPage, id: `page-${currentPage}` },
      { value: currentPage + 1, id: `page-${currentPage + 1}` },
      { value: '...', id: 'ellipsis-end' },
      { value: totalPages, id: `page-${totalPages}` }
    ];
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
        {getPageNumbers().map((item) => {
          const isCurrent = item.value === currentPage;
          const isEllipsis = item.value === '...';
          
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
              key={item.id}
              onClick={() => !isEllipsis && onPageChange(Number(item.value))}
              disabled={isEllipsis}
              type="button"
              className={btnClass}
            >
              {item.value}
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

