import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storyService } from '../services/storyService';
import { categoryService } from '../services/categoryService';
import { StoryCard } from '../components/common/StoryCard';
import { StoryCardSkeleton } from '../components/common/LoadingSkeleton';
import {
  BookOpen,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  Quote,
  Mail,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Home = () => {
  const [featuredStories, setFeaturedStories] = useState([]);
  const [newStories, setNewStories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featRes, newRes, catRes] = await Promise.all([
          storyService.getFeaturedStories(),
          storyService.getStories({ limit: 4, sort: 'newest' }),
          categoryService.getCategories()
        ]);

        if (featRes.success) setFeaturedStories(featRes.data);
        if (newRes.success) setNewStories(newRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stories?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      toast('Newsletter subscriptions are not available yet. Please check back soon.');
      setNewsletterEmail('');
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-[#F3EFEA] border-b border-[#E8E1D9] py-16 sm:py-24">
        {/* Subtle decorative background accents */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#581C24]/10 border border-[#581C24]/20 text-[#581C24] text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Authentic Contemporary &amp; Classic Urdu Literature
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1A1A1A] leading-[1.15]">
              Where Timeless Stories Find Their Voices.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 font-sans leading-relaxed max-w-2xl mx-auto">
              Sample the first 2 pages of any story entirely for free. Unlock complete unabridged
              editions safely through Easypaisa or JazzCash and build your personal digital library.
            </p>

            {/* Hero Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-xl mx-auto mt-8 flex items-center bg-white border-2 border-[#E8E1D9] focus-within:border-[#581C24] rounded-sm p-1.5 shadow-sm transition-all"
            >
              <div className="pl-3 text-stone-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by story title, author, or keyword (e.g. Ishq, Haveli, Karakoram)..."
                className="w-full px-3 py-2 text-sm text-stone-900 bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors"
              >
                Search
              </button>
            </form>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500 font-medium">
              <span>Popular Tags:</span>
              <Link to="/stories?search=Romance" className="hover:text-[#581C24] underline">#Romance</Link>
              <Link to="/stories?search=Mystery" className="hover:text-[#581C24] underline">#Mystery</Link>
              <Link to="/stories?search=Urdu" className="hover:text-[#581C24] underline">#UrduLiterature</Link>
              <Link to="/stories?search=Adventure" className="hover:text-[#581C24] underline">#Adventure</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest block mb-1">
            Simple 4-Step Process
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1A1A]">How QissaGhar Works</h2>
          <p className="text-sm text-stone-600 mt-2 font-sans">
            Start reading in seconds. Zero commitments before you sample the writing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Select a Story',
              desc: 'Explore curated novels, mystery thrillers, and classics across 8 distinct literary categories.',
              icon: BookOpen,
              to: '/stories?language=Urdu'
            },
            {
              step: '02',
              title: 'Read 2 Pages Free',
              desc: 'Experience the opening chapters on our crisp in-browser PDF reader with zero signup required.',
              icon: Zap
            },
            {
              step: '03',
              title: 'Pay via Mobile App',
              desc: 'Transfer the exact PKR price via Easypaisa or JazzCash and upload your receipt screenshot.',
              icon: ShieldCheck
            },
            {
              step: '04',
              title: 'Unlock Full Story',
              desc: 'Admin approves your transaction and the complete unabridged story is yours in My Library forever.',
              icon: Sparkles
            }
          ].map((item) => {
            const Icon = item.icon;
            const Card = item.to ? Link : 'div';
            return (
              <Card
                key={item.step}
                {...(item.to ? { to: item.to } : {})}
                className="block bg-white border border-[#E8E1D9] p-6 rounded-sm relative hover:border-[#C5A059] transition-all shadow-2xs group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#581C24] focus-visible:ring-offset-4"
              >
                <span className="font-serif text-4xl font-bold text-[#E8E1D9] group-hover:text-[#C5A059]/40 transition-colors absolute top-4 right-4">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded bg-[#581C24]/10 text-[#581C24] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-[#E8E1D9] gap-4">
          <div>
            <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest block mb-1">
              Handpicked by Editors
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1A1A1A]">Featured Stories</h2>
          </div>
          <Link
            to="/stories?isFeatured=true"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#581C24] hover:text-[#4A121A] transition-colors"
          >
            View All Featured <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Category Section */}
      <section className="bg-[#F3EFEA] border-y border-[#E8E1D9] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest block mb-1">
              Curated Shelves
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1A1A1A]">Browse by Category</h2>
            <p className="text-sm text-stone-600 mt-2 font-sans">
              Discover stories matching your exact mood and taste.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/category/${cat.slug}`}
                className="bg-white border border-[#E8E1D9] hover:border-[#581C24] p-5 rounded-sm flex flex-col justify-between transition-all hover:shadow-xs group"
              >
                <div>
                  <h4 className="font-serif text-base font-bold text-[#1A1A1A] group-hover:text-[#581C24] transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description || 'Explore rich story collection in this genre.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F3EFEA] flex items-center justify-between text-xs text-stone-400">
                  <span>{cat.storyCount || 0} stories</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#581C24] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newly Added Stories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-4 border-b border-[#E8E1D9] gap-4">
          <div>
            <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest block mb-1">
              Fresh Off The Press
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#1A1A1A]">Newly Added Stories</h2>
          </div>
          <Link
            to="/stories?sort=newest"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#581C24] hover:text-[#4A121A] transition-colors"
          >
            Explore All New Releases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newStories.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Reader Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest block mb-1">
            Community Voices
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1A1A]">What Readers Are Saying</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'Being able to read the first 2 pages before paying is brilliant. I read the preview of "The Whispering Shadows of Haveli" and unlocked it immediately with Easypaisa.',
              author: 'Maryam Bilal',
              location: 'Lahore',
              story: 'The Whispering Shadows of Haveli'
            },
            {
              quote:
                'The PDF reader is so clean and respectful of reading comfort. The dark mode in the browser feels like holding a luxury book in dim evening light.',
              author: 'Dr. Kamran Qureshi',
              location: 'Islamabad',
              story: 'The Caravan of Cordoba'
            },
            {
              quote:
                'Payment verification was approved in less than an hour. Having original, beautifully typeset Urdu stories in my digital library is a real delight.',
              author: 'Zohra Jamil',
              location: 'Karachi',
              story: 'Ishq e Majazi'
            }
          ].map((t, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E8E1D9] p-6 rounded-sm flex flex-col justify-between shadow-2xs"
            >
              <div>
                <Quote className="w-6 h-6 text-[#C5A059] mb-3 opacity-60" />
                <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed mb-4">
                  "{t.quote}"
                </p>
              </div>
              <div className="pt-4 border-t border-[#F3EFEA]">
                <p className="font-serif text-sm font-bold text-[#1A1A1A]">{t.author}</p>
                <p className="text-[11px] text-stone-400">
                  {t.location} • Read: <span className="text-[#581C24] font-medium">{t.story}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1C1917] text-[#FAF8F5] border-2 border-[#C5A059]/40 p-8 sm:p-12 rounded-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#581C24] text-[#DFC07A] flex items-center justify-center mx-auto mb-4 border border-[#C5A059]/30">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-2">The QissaGhar Gazette</h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto mb-6">
            Receive monthly literary reviews, early access to new Urdu translations, and exclusive author interviews.
          </p>
          <form
            onSubmit={handleNewsletter}
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="flex-1 px-4 py-2.5 text-xs text-white bg-stone-900 border border-stone-700 focus:outline-none focus:border-[#DFC07A] rounded-sm"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#581C24] hover:bg-[#6D232D] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              Subscribe <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
