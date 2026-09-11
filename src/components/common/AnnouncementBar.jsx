import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar = () => {
  return (
    <div className="bg-[#581C24] text-[#F3EFEA] text-xs py-2 px-4 border-b border-[#722F37]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="tracking-wide">
            Read the first <span className="font-semibold text-[#DFC07A]">2 preview pages for free</span> on every story! Instant unlock with Easypaisa &amp; JazzCash.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#DFC07A]">
          <Link to="/stories" className="hover:underline flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Browse Catalog
          </Link>
          <span className="text-[#84263B]">|</span>
          <span className="text-stone-300">Fast Manual Verification</span>
        </div>
      </div>
    </div>
  );
};
