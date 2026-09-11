import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { PdfReader } from '../components/reader/PdfReader';
import { useAuth } from '../hooks/useAuth';

export const ReaderPage = () => {
  const { slug } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    const initReader = async () => {
      setLoading(true);
      setError(null);
      setHasFullAccess(false);
      try {
        const storyRes = await storyService.getStoryBySlug(slug);
        if (!active) return;
        if (!storyRes.success || !storyRes.data) {
          setError('Story not found or not available.');
          setLoading(false);
          return;
        }

        const storyData = storyRes.data;
        setStory(storyData);

        // Check access if authenticated or if story is free
        if (isAuthenticated) {
          try {
            const accessRes = await storyService.checkStoryAccess(storyData._id);
            if (!active) return;
            if (accessRes.success && accessRes.hasAccess) {
              setHasFullAccess(true);
            } else {
              setHasFullAccess(false);
            }
          } catch (accessErr) {
            setHasFullAccess(false);
          }
        } else {
          setHasFullAccess(false);
        }
      } catch (err) {
        console.error('Error loading reader story:', err);
        if (active) setError('Failed to load story for reading.');
      } finally {
        if (active) setLoading(false);
      }
    };

    initReader();
    return () => { active = false; };
  }, [slug, isAuthenticated, authLoading, user?._id]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#1F1E1D] flex flex-col items-center justify-center text-[#E8E1D9]">
        <div className="w-10 h-10 border-4 border-[#C5A059]/30 border-t-[#DFC07A] rounded-full animate-spin mb-4"></div>
        <p className="font-serif text-lg text-white">Opening Book Reader...</p>
        <p className="text-xs text-stone-500 mt-1">Preparing your story</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#1F1E1D] flex flex-col items-center justify-center text-[#E8E1D9] p-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-white mb-2">Reading Error</h2>
        <p className="text-xs text-stone-400 mb-6">{error || 'Could not load reader.'}</p>
        <button
          onClick={() => navigate('/stories')}
          className="px-5 py-2.5 bg-[#581C24] text-white text-xs font-semibold rounded uppercase tracking-wider"
        >
          Return to Stories Catalog
        </button>
      </div>
    );
  }

  // Determine correct PDF URL:
  // If user has full access -> full-content endpoint
  // Otherwise -> preview endpoint (2 pages)
  const pdfUrl = hasFullAccess
    ? storyService.getFullPdfUrl(story._id)
    : storyService.getPreviewPdfUrl(story._id);

  return (
    <PdfReader
      pdfUrl={pdfUrl}
      story={story}
      hasFullAccess={hasFullAccess}
      previewPagesLimit={2}
    />
  );
};
