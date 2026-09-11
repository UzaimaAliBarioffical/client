import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter administrator credentials.');
      return;
    }

    setSubmitting(true);
    const res = await login({ email, password });
    setSubmitting(false);

    if (res.success) {
      if (res.user?.role === 'admin') {
        toast.success('Admin authorized. Welcome to the Control Portal.');
        navigate('/admin');
      } else {
        toast.error('Access restricted. This account does not possess administrator privileges.');
        navigate('/');
      }
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#141211] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#FAF8F5]">
      <div className="max-w-md w-full bg-[#1C1917] border border-stone-800 rounded-sm p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded bg-[#581C24] text-[#DFC07A] flex items-center justify-center mx-auto border border-[#C5A059]/40 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-[#DFC07A]" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
            Staff Administrator Portal
          </h1>
          <p className="text-xs text-stone-400 font-mono">
            Restricted access for editorial curation and payment audits.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@storyplatform.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-900 border border-stone-700 text-white rounded focus:outline-none focus:border-[#DFC07A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs bg-stone-900 border border-stone-700 text-white rounded focus:outline-none focus:border-[#DFC07A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#581C24] hover:bg-[#6E212C] text-white text-xs font-semibold uppercase tracking-wider rounded shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-800 text-xs text-stone-500">
          <Link to="/" className="text-stone-400 hover:text-white underline">
            Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
};
