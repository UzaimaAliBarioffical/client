import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getAuthHeaders } from '../../services/api';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Lock,
  BookOpen,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LockOverlay } from './LockOverlay';

// Set up worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const PdfReader = ({
  pdfUrl,
  story,
  hasFullAccess = false,
  previewPagesLimit = 2
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(800);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const visiblePages = hasFullAccess ? totalPages : Math.min(totalPages, previewPagesLimit);
  const isLockedPage = !hasFullAccess && currentPage > visiblePages;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPdfDoc(null);
    setError(null);
    setCurrentPage(1);
    setScale(1);
    const task = pdfjsLib.getDocument({
      url: pdfUrl, withCredentials: true, httpHeaders: getAuthHeaders(),
      isEvalSupported: false, enableXfa: false
    });
    task.promise.then((doc) => {
      if (!active) return;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setError('Unable to open this edition. Please check your connection and access, then try again.');
      setLoading(false);
    });
    return () => {
      active = false;
      renderTaskRef.current?.cancel();
      task.destroy().catch(() => {});
    };
  }, [pdfUrl]);

  useEffect(() => {
    const element = containerRef.current;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width - (entry.contentRect.width < 640 ? 32 : 64)));
    if (element) observer.observe(element);
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => { observer.disconnect(); document.removeEventListener('fullscreenchange', syncFullscreen); };
  }, []);

  useEffect(() => {
    if (!pdfDoc || loading || isLockedPage) return;
    let active = true;
    let task;
    (async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!active || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(availableWidth / base.width, 1.4) * scale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        task = page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        if (active && err.name !== 'RenderingCancelledException') setError('This page could not be displayed. Please try opening the story again.');
      }
    })();
    return () => { active = false; task?.cancel(); };
  }, [pdfDoc, loading, currentPage, scale, availableWidth, isLockedPage]);

  const handlePrevPage = () => setCurrentPage((page) => Math.max(1, page - 1));
  const handleNextPage = () => setCurrentPage((page) => Math.min(page + 1, hasFullAccess ? totalPages : visiblePages + 1));
  const handleZoomIn = () => setScale((value) => Math.min(value + 0.2, 2.4));
  const handleZoomOut = () => setScale((value) => Math.max(value - 0.2, 0.6));
  const handleFitWidth = () => setScale(1);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen?.();
    } catch { /* Fullscreen may be unavailable on mobile browsers. */ }
  };

  return (
    <div
      ref={containerRef}
      className="h-dvh bg-[#1F1E1D] text-[#E8E1D9] flex flex-col selection:bg-[#581C24]"
    >
      {/* Reader Top Toolbar */}
      <header className="sticky top-0 z-30 bg-[#141211]/95 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            to={`/story/${story?.slug}`}
            className="p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Back to story page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
          </Link>

          <div className="border-l border-stone-800 pl-3">
            <h1 className="font-serif text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {story?.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span>By {story?.author}</span>
              <span>•</span>
              {hasFullAccess ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Full Edition Unlocked
                </span>
              ) : (
                <span className="text-[#DFC07A] font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 2-Page Free Preview
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-2 bg-[#262422] px-3 py-1.5 rounded border border-stone-700">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            className="p-1 text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs text-stone-300 min-w-[70px] text-center">
            {isLockedPage ? (
              <span className="text-[#DFC07A] font-bold">LOCKED</span>
            ) : (
              `Page ${currentPage} of ${visiblePages}`
            )}
          </span>

          <button
            onClick={handleNextPage}
            disabled={
              (!hasFullAccess && currentPage > visiblePages) ||
              (hasFullAccess && currentPage >= totalPages) ||
              loading
            }
            className="p-1 text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom & Layout Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.6 || loading}
            className="p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs text-stone-400 px-1">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.4 || loading}
            className="p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleFitWidth}
            className="inline-flex px-2 py-1 text-xs text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
            title="Fit Width"
          >
            Fit
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Reader Main Canvas Viewport */}
      <main className="flex-1 min-h-0 flex items-start justify-start p-4 sm:p-8 overflow-auto">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#DFC07A] animate-spin" />
            <p className="font-serif text-lg text-stone-300">Loading Protected PDF...</p>
            <p className="text-xs text-stone-500 font-sans">
              Preparing high-resolution book pages
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-md p-6 bg-rose-950/40 border border-rose-800 rounded-sm text-center">
            <p className="font-serif text-lg font-bold text-rose-300 mb-2">Reading Error</p>
            <p className="text-xs text-rose-200 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-800 hover:bg-rose-700 rounded transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col items-center justify-center min-w-full w-max">
            {isLockedPage ? (
              <LockOverlay story={story} />
            ) : (
              <div className="shadow-2xl rounded-xs overflow-hidden border border-stone-800 bg-white transition-transform duration-200">
                <canvas ref={canvasRef} className="block mx-auto" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reader Bottom Mobile Bar */}
      <footer className="sm:hidden bg-[#141211] border-t border-stone-800 p-3 flex items-center justify-between text-xs text-stone-400">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1 || loading || Boolean(error)}
          className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-stone-200 disabled:opacity-30"
        >
          Previous
        </button>

        <span>
          {isLockedPage ? 'Locked' : `Page ${currentPage} / ${visiblePages}`}
        </span>

        <button
          onClick={handleNextPage}
          disabled={loading || Boolean(error) || (hasFullAccess ? currentPage >= totalPages : isLockedPage)}
          className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-stone-200 disabled:opacity-30"
        >
          Next
        </button>
      </footer>
    </div>
  );
};
