import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
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
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const PdfReader = ({
  pdfUrl,
  story,
  hasFullAccess = false,
  previewPagesLimit = 2
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLockedPage, setIsLockedPage] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setIsLockedPage(false);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('PDF load error:', err);
        if (isMounted) {
          setError(
            err.message ||
              'Failed to load the PDF document. Please ensure your connection is stable.'
          );
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || loading) return;

    // Check if current page is locked
    if (!hasFullAccess && currentPage > previewPagesLimit) {
      setIsLockedPage(true);
      return;
    } else {
      setIsLockedPage(false);
    }

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale });

        // High DPI handling
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, hasFullAccess, previewPagesLimit, loading]);

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    const maxPage = hasFullAccess ? totalPages : previewPagesLimit + 1;
    if (currentPage < maxPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.7));
  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48; // padding
      // Standard A4 width is roughly 595pt
      const newScale = Math.min(Math.max(containerWidth / 600, 0.7), 1.8);
      setScale(parseFloat(newScale.toFixed(2)));
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#1F1E1D] text-[#E8E1D9] flex flex-col selection:bg-[#581C24]"
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
              `Page ${currentPage} of ${hasFullAccess ? totalPages : previewPagesLimit}`
            )}
          </span>

          <button
            onClick={handleNextPage}
            disabled={
              (!hasFullAccess && currentPage > previewPagesLimit) ||
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
            disabled={scale <= 0.8 || loading}
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
            className="hidden sm:inline-flex px-2 py-1 text-xs text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
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
          <div className="flex flex-col items-center justify-center w-full">
            {isLockedPage ? (
              <LockOverlay story={story} />
            ) : (
              <div className="shadow-2xl rounded-xs overflow-hidden border border-stone-800 bg-white transition-transform duration-200">
                <canvas ref={canvasRef} className="block mx-auto max-w-full" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reader Bottom Mobile Bar */}
      <footer className="sm:hidden bg-[#141211] border-t border-stone-800 p-3 flex items-center justify-between text-xs text-stone-400">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-stone-200 disabled:opacity-30"
        >
          Previous
        </button>

        <span>
          {isLockedPage ? 'Locked' : `Page ${currentPage} / ${hasFullAccess ? totalPages : 2}`}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage > previewPagesLimit && !hasFullAccess}
          className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-stone-200 disabled:opacity-30"
        >
          Next
        </button>
      </footer>
    </div>
  );
};
