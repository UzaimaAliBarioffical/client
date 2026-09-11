import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { useAuth } from '../hooks/useAuth';
import { StoryCard } from '../components/common/StoryCard';
import { Badge } from '../components/common/Badge';
import {
  BookOpen,
  Sparkles,
  Lock,
  CheckCircle2,
  Share2,
  ArrowLeft,
  User,
  Globe,
  FileText,
  Eye,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StoryDetail = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true);
      try {
        const res = await storyService.getStoryBySlug(slug);
        if (res.success) {
          setStory(res.data);
        } else {
          setError('Story not found.');
        }
      } catch (err) {
        setError('Failed to load story details.');
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Story link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <div className="w-10 h-10 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E8E1D9] text-center rounded-sm">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Story Not Found</h2>
        <p className="text-xs text-stone-600 mb-6">{error || 'The requested story could not be located.'}</p>
        <Link
          to="/stories"
          className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] rounded"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const coverUrl = story.coverImage
    ? story.coverImage.startsWith('http')
      ? story.coverImage
      : `/${story.coverImage.replace(/\\/g, '/')}`
    : '/placeholder-cover.svg';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <Link
        to="/stories"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#581C24] uppercase tracking-wider mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
      </Link>

      {/* Main Story Hero Container */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 sm:p-10 shadow-sm mb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Cover Column */}
          <div className="md:col-span-5 lg:col-span-4">
            <div className="relative aspect-[3/4] bg-[#F3EFEA] rounded-sm overflow-hidden border border-[#E8E1D9] shadow-md">
              <img
                src={coverUrl}
                alt={story.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {story.isFeatured && (
                  <Badge variant="gold" size="xs">
                    <Sparkles className="w-2.5 h-2.5" /> Featured
                  </Badge>
                )}
                <Badge variant="primary" size="xs">
                  2 Pages Free
                </Badge>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category and Language Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs mb-3 font-mono">
                {story.category && (
                  <Link
                    to={`/category/${story.category.slug}`}
                    className="text-[#581C24] bg-[#581C24]/10 hover:bg-[#581C24]/15 px-2.5 py-1 rounded font-semibold transition-colors"
                  >
                    {story.category.name}
                  </Link>
                )}
                <span className="text-stone-400">•</span>
                <span className="text-stone-600 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> {story.language}
                </span>
                <span className="text-stone-400">•</span>
                <span className="text-stone-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> {story.totalPages} Total Pages
                </span>
                <span className="text-stone-400">•</span>
                <span className="text-stone-500 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {story.views || 0} Reads
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight mb-2">
                {story.title}
              </h1>

              {/* Author */}
              <p className="text-base text-stone-600 font-sans flex items-center gap-2 mb-6">
                <span>By</span>
                <span className="font-semibold text-stone-900">{story.author}</span>
              </p>

              {/* Unlocked Status Banner (If User owns it) */}
              {story.isUnlocked && (
                <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-sm mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Story Unlocked
                    </p>
                    <p className="text-xs text-emerald-700">
                      You have full lifetime access to this unabridged story.
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="prose prose-stone text-xs sm:text-sm text-stone-700 leading-relaxed max-w-none mb-6">
                <p className="font-medium text-stone-900 text-sm sm:text-base mb-3 leading-relaxed">
                  {story.shortDescription}
                </p>
                <div className="whitespace-pre-line border-t border-[#F3EFEA] pt-4">
                  {story.description}
                </div>
              </div>

              {/* Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-6">
                  <span className="text-xs text-stone-400 font-mono">Tags:</span>
                  {story.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-[#FAF8F5] border border-[#E8E1D9] text-stone-600 px-2 py-0.5 rounded font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Box */}
            <div className="bg-[#FAF8F5] border border-[#E8E1D9] p-5 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-stone-500 font-mono uppercase tracking-wider block">
                  Price to Unlock Full Story
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#581C24]">
                    {story.price > 0 ? `PKR ${story.price.toLocaleString()}` : 'FREE'}
                  </span>
                  <span className="text-xs text-stone-500 font-sans">
                    (Includes complete PDF + all chapters)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleShare}
                  className="p-2.5 border border-[#E8E1D9] rounded bg-white text-stone-600 hover:text-[#581C24] transition-colors"
                  title="Share Story"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Read Preview Button */}
                <Link
                  to={`/story/${story.slug}/read`}
                  className="flex-1 sm:flex-none text-center py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#581C24] bg-white border border-[#581C24]/30 hover:bg-[#581C24]/5 rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  {story.isUnlocked ? 'Read Full Story' : 'Read 2 Pages Free'}
                </Link>

                {/* Unlock Button if not unlocked */}
                {!story.isUnlocked && story.price > 0 && (
                  <Link
                    to={`/checkout/${story._id}`}
                    className="flex-1 sm:flex-none text-center py-2.5 px-5 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] hover:bg-[#4A121A] rounded shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-[#DFC07A]" />
                    Unlock Full Story
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Stories */}
      {story.relatedStories && story.relatedStories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E8E1D9]">
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
              More from {story.category?.name}
            </h2>
            <Link
              to={`/category/${story.category?.slug}`}
              className="text-xs font-semibold uppercase tracking-wider text-[#581C24] hover:underline"
            >
              View All in Genre
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {story.relatedStories.map((rel) => (
              <StoryCard key={rel._id} story={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
