import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Info, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success('Password reset request recorded.');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-[#E8E1D9] rounded-sm p-8 shadow-sm space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#581C24] font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>

        <div className="text-center space-y-2">
          <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">Reset Your Password</h1>
          <p className="text-xs text-stone-600 font-sans">
            Enter your registered email address to request account recovery instructions.
          </p>
        </div>

        {/* Clear TODO / Notice box */}
        <div className="bg-amber-50 border border-amber-300 p-3.5 rounded text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Email Delivery Service Status:</p>
            <p className="leading-relaxed">
              Automated SMTP/SendGrid dispatch is currently unconfigured in this deployment.
              For urgent account or password resets, please contact the administrator at{' '}
              <a href="mailto:admin@storyplatform.com" className="underline font-mono">
                admin@storyplatform.com
              </a>.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center text-xs text-emerald-800 space-y-2">
            <p className="font-bold">Request Logged</p>
            <p>
              If an account matching <strong>{email}</strong> exists, instructions will be processed.
            </p>
            <Link
              to="/login"
              className="inline-block mt-3 text-[#581C24] underline font-semibold"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Request Password Reset
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
