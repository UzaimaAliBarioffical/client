import { apiUrl } from '../../services/api';
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, User } from 'lucide-react';
import { Badge } from './Badge';
import { normalizeLanguage } from '../../utils/language';

export const StoryCard = ({ story }) => {
  const coverUrl = story.coverImage ? apiUrl(story.coverImage) : '/placeholder-cover.svg';
  const language = normalizeLanguage(story.language);
  const languageLabel = language === 'all' ? 'Language unspecified' : language;
  const textDirection = language === 'Urdu' ? 'rtl' : language === 'English' ? 'ltr' : 'auto';
  const textLanguage = language === 'Urdu' ? 'ur' : language === 'English' ? 'en' : undefined;
  const price = typeof story.price === 'number' && Number.isFinite(story.price) && story.price >= 0 ? story.price : null;
  const hasPreview = Number.isInteger(story.totalPages) && story.totalPages > 0;
  const previewPages = Math.min(2, story.totalPages);

  return (
    <div className="group bg-white border border-[#E8E1D9] hover:border-[#581C24]/50 rounded-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] bg-[#F3EFEA] overflow-hidden border-b border-[#E8E1D9]">
        <img
          loading="lazy"
          decoding="async"
          width="300"
          height="400"
          src={coverUrl}
          alt={story.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-cover.svg';
          }}
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {story.isFeatured && (
            <Badge variant="gold" size="xs" className="shadow-xs backdrop-blur-xs">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </Badge>
          )}
          {hasPreview && <Badge variant="primary" size="xs" className="bg-white/90 shadow-xs backdrop-blur-xs">
            {previewPages} {previewPages === 1 ? 'Page' : 'Pages'} Free
          </Badge>}
        </div>

        {/* Category Badge Bottom-Right */}
        {story.category && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="text-[10px] font-medium tracking-wider uppercase bg-black/75 text-[#FAF8F5] px-2 py-0.5 rounded backdrop-blur-xs">
              {story.category.name || story.category}
            </span>
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Badge variant="gold" size="xs">{languageLabel}</Badge>
            {hasPreview && <span className="text-[11px] text-stone-500">{story.totalPages} pages</span>}
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 font-sans">
            <span className="flex items-center gap-1 min-w-0">
              <User className="w-3 h-3 text-stone-400" />
              <bdi dir={textDirection} lang={textLanguage} className="truncate">{story.author}</bdi>
            </span>
          </div>

          <h3 dir={textDirection} lang={textLanguage} className="font-serif text-lg font-bold text-[#1A1A1A] group-hover:text-[#581C24] transition-colors line-clamp-2 leading-snug">
            {story.title}
          </h3>

          <p dir={textDirection} lang={textLanguage} className="text-xs text-stone-600 line-clamp-2 mt-2 leading-relaxed font-sans">
            {story.shortDescription || story.description}
          </p>
        </div>

        {/* Pricing & CTA Buttons */}
        <div className="mt-4 pt-3 border-t border-[#F3EFEA]">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-xs text-stone-500 font-medium">Story Price</span>
            <div className="text-right">
              <span className="text-base font-serif font-bold text-[#581C24]">
                {price === null ? 'Price unavailable' : price === 0 ? 'Free' : `PKR ${price.toLocaleString('en-PK')}`}
              </span>
            </div>
          </div>

          <div className={`grid ${hasPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
            <Link
              to={`/story/${story.slug}`}
              className="w-full text-center py-2 px-2 text-xs font-medium text-stone-700 bg-[#FAF8F5] hover:bg-[#E8E1D9] border border-[#E8E1D9] rounded-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#581C24] focus-visible:ring-offset-2"
            >
              View Story
            </Link>
            {hasPreview && <Link
              to={`/story/${story.slug}/read`}
              className="w-full text-center py-2 px-2 text-xs font-medium text-white bg-[#581C24] hover:bg-[#4A121A] rounded-xs transition-colors flex items-center justify-center gap-1 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#581C24] focus-visible:ring-offset-2"
            >
              <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" /> {previewPages === 2 ? 'Read 2 Pages Free' : 'Read Free Preview'}
            </Link>}
          </div>
        </div>
      </div>
    </div>
  );
};
