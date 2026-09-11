import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { FolderTree, BookOpen, ArrowRight } from 'lucide-react';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    }).catch(() => setError('Categories could not be loaded. Please try again shortly.')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest block mb-1">
          Literary Genres
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
          Explore Story Categories
        </h1>
        <p className="text-sm text-stone-600 mt-2 font-sans">
          From suspenseful mysteries to timeless romance and golden history, discover complete
          works organized by category.
        </p>
      </div>

      {error && <p role="alert" className="text-center text-[#581C24] py-6">{error} <button className="underline" onClick={() => window.location.reload()}>Retry</button></p>}
      {!loading && !error && categories.length === 0 && <p className="text-center text-stone-500 py-6">New categories are coming soon.</p>}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-[#E8E1D9] rounded animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/category/${cat.slug}`}
              className="bg-white border border-[#E8E1D9] hover:border-[#581C24] p-6 rounded-sm flex flex-col justify-between transition-all hover:shadow-md group"
            >
              <div>
                <div className="w-10 h-10 rounded bg-[#581C24]/10 text-[#581C24] flex items-center justify-center mb-4">
                  <FolderTree className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] group-hover:text-[#581C24] transition-colors mb-2">
                  {cat.name}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {cat.description || 'Curated literary stories in this genre.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F3EFEA] flex items-center justify-between text-xs text-stone-500 font-mono">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                  {cat.storyCount || 0} stories
                </span>
                <span className="text-[#581C24] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Browse <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
