import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LockOverlay = ({ story }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="w-full max-w-xl mx-auto my-8 bg-[#1A1A1A] border-2 border-[#C5A059]/40 rounded-sm p-8 text-center text-[#FAF8F5] shadow-2xl animate-in zoom-in-95 duration-200">
      {/* Gold Glowing Lock Icon */}
      <div className="w-16 h-16 rounded-full bg-[#581C24] border-2 border-[#DFC07A] flex items-center justify-center mx-auto mb-5 shadow-lg">
        <Lock className="w-8 h-8 text-[#DFC07A]" />
      </div>

      <span className="inline-block px-3 py-1 rounded bg-[#C5A059]/20 text-[#DFC07A] text-[11px] font-mono uppercase tracking-widest mb-3 border border-[#C5A059]/30">
        End of Free 2-Page Preview
      </span>

      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
        Continue Reading "{story?.title}"
      </h2>

      <p className="text-sm text-stone-300 mb-6 max-w-md mx-auto leading-relaxed">
        You have experienced the complimentary preview pages. Unlock the complete, unabridged
        edition to discover all chapters, mysteries, and original story illustrations.
      </p>

      {/* Price Highlight */}
      <div className="bg-[#262626] border border-stone-800 rounded p-4 mb-6 flex items-center justify-between">
        <div className="text-left">
          <p className="text-xs text-stone-400 font-sans">Full Story Price</p>
          <p className="text-xs text-stone-500 font-mono">Lifetime Unlocked Access</p>
        </div>
        <div className="text-right">
          <span className="font-serif text-2xl font-bold text-[#DFC07A]">
            PKR {story?.price?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="space-y-3">
        {isAuthenticated ? (
          <Link
            to={`/checkout/${story?._id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded text-sm font-semibold tracking-wide text-white bg-[#581C24] hover:bg-[#6D232D] border border-[#DFC07A]/40 shadow-md transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-[#DFC07A]" />
            Unlock Story Now (Easypaisa / JazzCash)
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="space-y-3">
            <Link
              to="/login"
              state={{ from: { pathname: `/checkout/${story?._id}` } }}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded text-sm font-semibold tracking-wide text-white bg-[#581C24] hover:bg-[#6D232D] border border-[#DFC07A]/40 shadow-md transition-all"
            >
              Sign In to Unlock Story
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-stone-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#DFC07A] underline hover:text-white">
                Create one in 30 seconds
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* How Unlock Works in 3 Steps */}
      <div className="mt-8 pt-6 border-t border-stone-800 text-left">
        <p className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3">
          How manual unlocking works:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-400">
          <div className="flex items-start gap-2 bg-stone-900/60 p-2 rounded border border-stone-800">
            <span className="w-4 h-4 rounded-full bg-[#581C24] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              1
            </span>
            <span>Send amount via Easypaisa or JazzCash</span>
          </div>
          <div className="flex items-start gap-2 bg-stone-900/60 p-2 rounded border border-stone-800">
            <span className="w-4 h-4 rounded-full bg-[#581C24] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              2
            </span>
            <span>Upload receipt screenshot &amp; TID</span>
          </div>
          <div className="flex items-start gap-2 bg-stone-900/60 p-2 rounded border border-stone-800">
            <span className="w-4 h-4 rounded-full bg-[#581C24] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              3
            </span>
            <span>Admin approves &amp; story unlocks immediately</span>
          </div>
        </div>
      </div>
    </div>
  );
};
