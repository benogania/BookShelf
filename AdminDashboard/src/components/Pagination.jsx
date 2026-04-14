import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center space-x-2">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-slate-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition"
      >
        Prev
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded text-sm transition ${
            currentPage === page
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-slate-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-slate-600 transition"
      >
        Next
      </button>
    </div>
  );
}