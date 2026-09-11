import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { categoryService } from '../services/categoryService';
import { StoryCard } from '../components/common/StoryCard';
import { StoryCardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ArrowLeft, FolderTree } from 'lucide-react';

export const CategoryStories = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryAndStories = async () => {
      setLoading(true);
      try {
        const catRes = await categoryService.getCategoryBySlug(slug);
        if (catRes.success) {
          setCategory(catRes.data);
          const storiesRes = await storyService.getStories({ category: slug });
          if (storiesRes.success) {
            setStories(storiesRes.data);
          }
        }
      } catch (err) {
        console.error('Error loading category stories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryAndStories();
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb / Back */}
      <Link
        to="/categories"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#581C24] uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All Categories
      </Link>

      {/* Category Hero */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 sm:p-8 mb-10 shadow-2xs">
        <div className="flex items-center gap-3 text-xs font-mono text-[#581C24] uppercase tracking-widest mb-2">
          <FolderTree className="w-4 h-4" /> Category Showcase
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
          {category?.name || slug} Stories
        </h1>
        {category?.description && (
          <p className="text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          title="No stories in this category yet"
          message="Our editors are working on new releases for this genre. Check back soon!"
          actionText="Explore All Stories"
          actionLink="/stories"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {stories.map((story) => (
            <StoryCard key={story._id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
};
