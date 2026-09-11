import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Your message has been received! Our support staff will respond shortly.');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-mono text-[#581C24] uppercase tracking-widest">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1A1A]">
          Contact &amp; Author Inquiries
        </h1>
        <p className="text-base text-stone-600 font-sans max-w-xl mx-auto leading-relaxed">
          Questions regarding payment verification, story submissions, or reader assistance?
          Our team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Contact Info */}
        <div className="md:col-span-5 bg-[#1C1917] text-[#FAF8F5] p-8 rounded-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-serif text-xl font-bold text-white border-b border-stone-800 pb-3">
              Editorial Offices
            </h3>

            <div className="space-y-4 text-xs text-stone-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#DFC07A] shrink-0 mt-0.5" />
                <span>The Mall Road &amp; Gulberg III, Lahore, Punjab, Pakistan</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#DFC07A] shrink-0" />
                <span className="font-mono">support@storyplatform.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#DFC07A] shrink-0" />
                <span className="font-mono">+92 300 1234567</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 text-[11px] text-stone-400">
            <p className="font-semibold text-stone-200 mb-1">Author Submissions:</p>
            <p>
              We welcome submissions from established and emerging writers in Urdu and English.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white border border-[#E8E1D9] p-8 rounded-sm shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Payment Verification Assistance"
                className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Message *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How may we assist you today?"
                className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
