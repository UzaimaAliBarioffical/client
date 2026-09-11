import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-[#E8E1D9] rounded bg-white text-stone-700 hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 font-mono text-xs">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, idx, arr) => {
            const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-1 text-stone-400">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#581C24] text-white font-bold'
                      : 'border border-[#E8E1D9] bg-white text-stone-700 hover:bg-[#FAF8F5]'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-[#E8E1D9] rounded bg-white text-stone-700 hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
