import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { apiUrl } from '../../services/api';
import { EmptyState } from '../../components/common/EmptyState';
import { BookOpen, Sparkles, Calendar, ArrowRight } from 'lucide-react';

export const AccountLibrary = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    paymentService.getUserLibrary().then((res) => {
      if (!res.success) throw new Error('Could not load your library.');
      if (active) setStories(res.data);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'Could not load your library. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F3EFEA] mb-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">My Unlocked Library</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Your collection of purchased and unlocked digital story editions.
          </p>
        </div>
        <span className="text-xs font-mono bg-[#FAF8F5] border border-[#E8E1D9] px-2.5 py-1 rounded text-stone-600">
          {stories.length} {stories.length === 1 ? 'Book' : 'Books'} Available
        </span>
        <button onClick={() => setRefresh((value) => value + 1)} className="text-xs text-[#581C24] underline">Refresh Library</button>
      </div>

      {error ? <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800">{error}</div> : stories.length === 0 ? (
        <EmptyState
          title="Your library is currently empty"
          message="You have not unlocked any stories yet. Explore our curated catalog, read free previews, and unlock your first tale today!"
          actionText="Discover Stories"
          actionLink="/stories"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {stories.map((story) => {
            const coverUrl = story.coverImage ? apiUrl(story.coverImage) : '/placeholder-cover.svg';

            return (
              <div
                key={story._id}
                className="border border-[#E8E1D9] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[#581C24] transition-all group"
              >
                <div>
                  <div className="aspect-[3/4] bg-[#F3EFEA] relative overflow-hidden">
                    <img
                      src={coverUrl}
                      alt={story.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith('/placeholder-cover.svg')) e.currentTarget.src = '/placeholder-cover.svg';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded shadow">
                        Unlocked
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="truncate">{story.author}</span>
                      <span className="font-mono">{story.totalPages} pgs</span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-stone-900 group-hover:text-[#581C24] transition-colors line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-2 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      Unlocked: {new Date(story.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <Link
                    to={`/story/${story.slug}/read`}
                    className="w-full py-2 px-3 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] hover:bg-[#4A121A] rounded text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Read Full Story
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
