import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white border border-[#E8E1D9] p-8 sm:p-12 rounded-sm shadow-sm space-y-4">
        <span className="font-serif text-6xl font-bold text-[#581C24] block">404</span>
        <h1 className="font-serif text-2xl font-bold text-stone-900">
          Page Not In This Chapter
        </h1>
        <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
          The page or manuscript you are looking for has been moved, unpublished, or does not
          exist in our digital shelves.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
