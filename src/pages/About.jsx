import React from 'react';
import { BookOpen, ShieldCheck, Heart, Users, Sparkles, Feather } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest">
          Editorial Manifesto
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1A1A]">
          About QissaGhar
        </h1>
        <p className="text-base text-stone-600 font-sans max-w-2xl mx-auto leading-relaxed">
          Reviving the elegance of independent storytelling and Urdu literature for the digital age.
        </p>
      </div>

      <div className="bg-white border border-[#E8E1D9] rounded-sm p-8 sm:p-12 shadow-sm space-y-8 text-stone-700 leading-relaxed font-sans text-sm sm:text-base">
        <div className="flex items-center gap-3 border-b border-[#F3EFEA] pb-4">
          <Feather className="w-6 h-6 text-[#581C24]" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">Our Mission</h2>
        </div>

        <p>
          QissaGhar was conceived out of a profound love for traditional storytelling, Urdu afsane,
          and compelling fiction. For decades, readers across Pakistan and the diaspora have
          treasured literary journals and pocket novels. Today, our goal is to bring that rich literary
          tradition into a clean, modern digital reading environment.
        </p>

        <p>
          We believe that readers should feel confident before purchasing. That is why every story on
          our platform provides the <strong>first 2 pages completely free of charge</strong>. No credit card,
          no trial subscription — just pure storytelling.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
          <div className="p-5 bg-[#FAF8F5] border border-[#E8E1D9] rounded">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
              Accessible Local Payments
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We empower every reader in Pakistan through direct Easypaisa and JazzCash payments,
              verified promptly by our editorial team.
            </p>
          </div>

          <div className="p-5 bg-[#FAF8F5] border border-[#E8E1D9] rounded">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
              Protected PDF Reader
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our in-browser canvas reader delivers an authentic book-reading experience with dark
              backgrounds, zoom precision, and zero clutter.
            </p>
          </div>
        </div>

        <div className="border-t border-[#F3EFEA] pt-6 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-mono">Curated in Lahore, Pakistan</span>
          <Link
            to="/stories"
            className="px-5 py-2.5 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            Explore Stories
          </Link>
        </div>
      </div>
    </div>
  );
};
