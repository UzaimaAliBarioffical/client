import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { categoryService } from '../services/categoryService';
import { StoryCard } from '../components/common/StoryCard';
import { StoryCardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { normalizeLanguage } from '../utils/language';
import {
  Search,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export const Stories = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalogueEmpty, setCatalogueEmpty] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Applied filters live in the URL so links, refresh and browser history agree.
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedLanguage = normalizeLanguage(searchParams.get('language'));
  const pricing = searchParams.get('pricing') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const requestedPage = Number(searchParams.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const appliedSearch = searchParams.get('search') || '';
  const appliedMin = searchParams.get('minPrice') || '';
  const appliedMax = searchParams.get('maxPrice') || '';
  const hasContentFilters = Boolean(appliedSearch || selectedCategory !== 'all' || pricing !== 'all' || appliedMin || appliedMax);
  const [search, setSearch] = useState(appliedSearch);
  const [minPrice, setMinPrice] = useState(appliedMin);
  const [maxPrice, setMaxPrice] = useState(appliedMax);
  const [refresh, setRefresh] = useState(0);
  const requestRef = useRef(null);

  useEffect(() => { setSearch(appliedSearch); }, [appliedSearch]);
  useEffect(() => { setMinPrice(appliedMin); }, [appliedMin]);
  useEffect(() => { setMaxPrice(appliedMax); }, [appliedMax]);

  // Canonical language links also apply to pasted aliases and browser refreshes.
  useEffect(() => {
    const raw = searchParams.get('language');
    const canonical = selectedLanguage === 'all' ? null : selectedLanguage;
    if (raw === canonical) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (canonical) next.set('language', canonical);
      else next.delete('language');
      return next;
    }, { replace: true });
  }, [searchParams, selectedLanguage, setSearchParams]);

  const languageUrl = (language) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (language === 'all') next.delete('language');
    else next.set('language', language);
    return `/stories${next.size ? `?${next}` : ''}`;
  };

  const updateFilters = (changes, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (resetPage) next.delete('page');
      for (const [key, value] of Object.entries(changes)) {
        if (!value || value === 'all' || (key === 'page' && value === 1) || (key === 'sort' && value === 'newest')) next.delete(key);
        else next.set(key, String(value));
      }
      if (next.has('language')) next.set('language', normalizeLanguage(next.get('language')));
      return next;
    });
  };

  // Fetch Categories once
  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    }).catch(() => {});
  }, []);

  // Fetch Stories whenever filters change
  const fetchStories = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        sort
      };

      if (appliedSearch) params.search = appliedSearch;
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedLanguage && selectedLanguage !== 'all') params.language = selectedLanguage;
      if (pricing && pricing !== 'all') params.pricing = pricing;
      if (appliedMin) params.minPrice = appliedMin;
      if (appliedMax) params.maxPrice = appliedMax;

      const res = await storyService.getStories(params, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!res.success || !Array.isArray(res.data) || !res.pagination) {
        throw new Error(res.message || 'The story service is temporarily unavailable. Please try again shortly.');
      }
      // A bookmarked page may disappear when an admin unpublishes a story.
      const lastPage = Math.max(1, res.pagination.totalPages);
      if (page > lastPage) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          if (lastPage === 1) next.delete('page');
          else next.set('page', String(lastPage));
          return next;
        }, { replace: true });
        controller.abort(); // Keep the loading state until the corrected page arrives.
        return;
      }
      let emptyCatalogue = res.pagination.total === 0;
      if (emptyCatalogue && (hasContentFilters || selectedLanguage !== 'all')) {
        // Check whether any published records exist; never show these records
        // under the selected filters or substitute another language's stories.
        const catalogue = await storyService.getStories({ page: 1, limit: 1 }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!catalogue.success || !Array.isArray(catalogue.data) || !catalogue.pagination) {
          throw new Error('The story service is temporarily unavailable. Please try again shortly.');
        }
        emptyCatalogue = catalogue.pagination.total === 0;
      }
      setStories(res.data);
      setPagination(res.pagination);
      setCatalogueEmpty(emptyCatalogue);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err.response?.data?.message || err.message || 'The story service is temporarily unavailable. Please try again shortly.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, sort, selectedCategory, selectedLanguage, pricing, appliedSearch, appliedMin, appliedMax, hasContentFilters, setSearchParams]);

  useEffect(() => {
    fetchStories();
    return () => requestRef.current?.abort();
  }, [fetchStories, refresh]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleApplyPriceFilter();
  };

  const handleApplyPriceFilter = () => {
    updateFilters({ search: search.trim(), minPrice, maxPrice });
    setRefresh((value) => value + 1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setRefresh((value) => value + 1);
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

      <nav aria-label="Story languages" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        {[
          { value: 'all', label: 'All Stories' },
          { value: 'Urdu', label: 'Urdu Stories', native: 'اردو کہانیاں' },
          { value: 'English', label: 'English Stories' }
        ].map(({ value, label, native }) => (
          <Link
            key={value}
            to={languageUrl(value)}
            aria-current={selectedLanguage === value ? 'page' : undefined}
            className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 rounded-sm border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] focus-visible:ring-offset-2 ${
              selectedLanguage === value
                ? 'bg-[#581C24] text-[#FAF8F5] border-[#581C24] shadow-sm'
                : 'bg-white text-[#581C24] border-[#E8E1D9] hover:bg-[#F3EFEA] hover:border-[#C5A059]'
            }`}
          >
            <span>{label}</span>
            {native && <><span aria-hidden="true">/</span><span dir="rtl" lang="ur">{native}</span></>}
          </Link>
        ))}
      </nav>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-4 mb-8 shadow-2xs space-y-4">
        {/* Top row: Search and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 flex items-center relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3" />
            <input
              type="text"
              aria-label="Search stories"
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
            <label htmlFor="story-sort" className="text-xs text-stone-500 font-medium shrink-0">Sort By:</label>
            <select
              id="story-sort"
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
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
              <label htmlFor="story-category" className="text-stone-500 font-medium">Category:</label>
              <select
                id="story-category"
                value={selectedCategory}
                onChange={(e) => updateFilters({ category: e.target.value })}
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

            {/* Price Filter Inputs */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">Price (PKR):</span>
              <input
                type="number"
                placeholder="Min"
                aria-label="Minimum price in PKR"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-16 py-1 px-2 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none"
              />
              <span className="text-stone-400">-</span>
              <input
                type="number"
                placeholder="Max"
                aria-label="Maximum price in PKR"
                min="0"
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
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
          </button>
        </div>
      </div>

      {/* Result Count Status */}
      <div role="status" aria-live="polite" className="flex items-center justify-between text-xs text-stone-500 mb-6 font-mono">
        <span>
          {loading ? 'Loading stories...' : error ? 'Stories could not be loaded.' : `Showing ${stories.length} of ${pagination.total} stories`}
        </span>
        {!loading && !error && pagination.totalPages > 1 && (
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
        )}
      </div>

      {/* Stories Grid / States */}
      {loading ? (
        <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="text-center py-12 bg-white border border-rose-200 rounded-sm p-6 max-w-md mx-auto">
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
          title={catalogueEmpty ? 'No published stories yet'
            : !hasContentFilters && selectedLanguage !== 'all' ? `No ${selectedLanguage} stories available`
              : 'No stories match your criteria'}
          message={catalogueEmpty ? 'The catalogue is currently empty. Published stories will appear here when they are available.'
            : !hasContentFilters && selectedLanguage !== 'all' ? `There are no published ${selectedLanguage} stories yet. Browse all stories to explore the other available languages.`
              : 'Try removing search terms or resetting your filters to browse all published stories.'}
          actionText={hasContentFilters ? 'Reset All Filters' : selectedLanguage !== 'all' ? 'Browse All Stories' : undefined}
          actionLink={!hasContentFilters && selectedLanguage !== 'all' ? '/stories' : undefined}
          onActionClick={hasContentFilters ? handleClearFilters : undefined}
          secondaryActionText={hasContentFilters && selectedLanguage !== 'all' ? 'Browse All Stories' : undefined}
          secondaryActionLink="/stories"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && stories.length > 0 && <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => {
          updateFilters({ page: p }, false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />}
    </div>
  );
};
