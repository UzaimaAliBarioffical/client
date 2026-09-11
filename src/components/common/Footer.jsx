import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck, Mail, Phone, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#1C1917] text-[#E8E1D9] border-t-4 border-[#581C24] pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#581C24] text-[#DFC07A] flex items-center justify-center font-serif text-xl font-bold border border-[#C5A059]/40">
                Q
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Qissa<span className="text-[#DFC07A]">Ghar</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Pakistan’s premier editorial digital library for curated Urdu and English stories.
              Read 2 preview pages free, support original authors, and unlock complete literary works.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#DFC07A] font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>Verified Manual Payments</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-white tracking-wide border-b border-stone-800 pb-2">
              Explore Library
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <Link to="/stories" className="hover:text-[#DFC07A] transition-colors">
                  All Story Catalog
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-[#DFC07A] transition-colors">
                  Browse by Category
                </Link>
              </li>
              <li>
                <Link to="/stories?pricing=free" className="hover:text-[#DFC07A] transition-colors">
                  Free Previews
                </Link>
              </li>
              <li>
                <Link to="/stories?sort=popular" className="hover:text-[#DFC07A] transition-colors">
                  Top Trending Tales
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-white tracking-wide border-b border-stone-800 pb-2">
              Payment Methods
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="p-2.5 bg-stone-900/90 rounded border border-stone-800 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="font-semibold text-stone-200">Easypaisa</p>
                  <p className="text-[11px] text-stone-500">Fast TRX verification</p>
                </div>
              </div>
              <div className="p-2.5 bg-stone-900/90 rounded border border-stone-800 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <div>
                  <p className="font-semibold text-stone-200">JazzCash</p>
                  <p className="text-[11px] text-stone-500">TID receipt upload</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Policy */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-white tracking-wide border-b border-stone-800 pb-2">
              Our Platform
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <Link to="/about" className="hover:text-[#DFC07A] transition-colors">
                  About QissaGhar
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#DFC07A] transition-colors">
                  Contact &amp; Author Submissions
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#DFC07A] transition-colors">
                  Reader Login
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-[#DFC07A] transition-colors text-stone-500">
                  Staff Admin Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} QissaGhar Platform. All rights reserved.</p>
          <p className="flex items-center gap-1 text-stone-400">
            Crafted for avid readers &amp; independent storytellers
          </p>
        </div>
      </div>
    </footer>
  );
};
