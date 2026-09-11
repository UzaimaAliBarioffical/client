import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { categoryService } from '../services/categoryService';
import { StoryCard } from '../components/common/StoryCard';
import { StoryCardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  BookOpen,
  AlertCircle
} from 'lucide-react';

export const Stories = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'all');
  const [pricing, setPricing] = useState(searchParams.get('pricing') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Fetch Categories once
  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  // Fetch Stories whenever filters change
  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        sort
      };

      if (search) params.search = search;
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedLanguage && selectedLanguage !== 'all') params.language = selectedLanguage;
      if (pricing && pricing !== 'all') params.pricing = pricing;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await storyService.getStories(params);
      if (res.success) {
        setStories(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Fetch stories error:', err);
      setError('Failed to load stories. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [page, sort, selectedCategory, selectedLanguage, pricing]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStories();
  };

  const handleApplyPriceFilter = () => {
    setPage(1);
    fetchStories();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedLanguage('all');
    setPricing('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8 pb-6 border-b border-[#E8E1D9]">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
          Complete Story Library
        </h1>
        <p className="text-sm text-stone-600 mt-2 font-sans">
          Browse through our curated catalog of Urdu and English stories. Read 2-page preview
          samples free, or unlock the entire story.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-4 mb-8 shadow-2xs space-y-4">
        {/* Top row: Search and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 flex items-center relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by story title, author or keyword..."
              className="w-full pl-9 pr-24 py-2 text-xs text-stone-900 border border-[#E8E1D9] focus:outline-none focus:border-[#581C24] rounded-sm"
            />
            <button
              type="submit"
              className="absolute right-1 px-3 py-1 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold rounded-xs transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium shrink-0">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs text-stone-800 border border-[#E8E1D9] bg-white rounded-sm focus:outline-none focus:border-[#581C24]"
            >
              <option value="newest">Newest Releases</option>
              <option value="popular">Most Popular</option>
              <option value="title">Title (A-Z)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Bottom row: Filter Controls */}
        <div className="pt-3 border-t border-[#F3EFEA] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs border border-[#E8E1D9] bg-[#FAF8F5] rounded focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name} ({cat.storyCount || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs border border-[#E8E1D9] bg-[#FAF8F5] rounded focus:outline-none"
              >
                <option value="all">All Languages</option>
                <option value="Urdu">Urdu</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* Price Filter Inputs */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Price (PKR):</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-16 py-1 px-2 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none"
              />
              <span className="text-stone-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-16 py-1 px-2 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none"
              />
              <button
                onClick={handleApplyPriceFilter}
                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-xs transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-stone-500 hover:text-[#581C24] font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        </div>
      </div>

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-stone-500 mb-6 font-mono">
        <span>
          Showing {stories.length} of {pagination.total} stories
        </span>
        {pagination.totalPages > 1 && (
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
        )}
      </div>

      {/* Stories Grid / States */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white border border-rose-200 rounded-sm p-6 max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Could Not Load Stories</h3>
          <p className="text-xs text-stone-600 mb-4">{error}</p>
          <button
            onClick={fetchStories}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] rounded"
          >
            Retry
          </button>
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          title="No stories match your criteria"
          message="Try loosening your filters, removing search terms, or resetting to browse all published titles."
          actionText="Reset All Filters"
          onActionClick={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
