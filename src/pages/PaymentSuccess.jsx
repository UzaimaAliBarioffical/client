import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import {
  CheckCircle2,
  Clock,
  Library,
  CreditCard,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const PaymentSuccess = () => {
  const location = useLocation();
  const payment = location.state?.payment;
  const story = location.state?.story;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-8 sm:p-12 shadow-sm">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 rounded bg-amber-50 text-amber-800 text-xs font-mono uppercase tracking-wider mb-2 border border-amber-200">
          Verification Request Submitted
        </span>

        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
          Thank You! Your Payment Is Under Review
        </h1>

        <p className="text-sm text-stone-600 leading-relaxed mb-8 max-w-lg mx-auto">
          We have received your payment verification request for{' '}
          <strong className="text-stone-900 font-semibold">{story?.title || 'the story'}</strong>.
          Our team is currently matching your transaction ID against bank records.
        </p>

        {/* Verification Summary Card */}
        {payment && (
          <div className="bg-[#FAF8F5] border border-[#E8E1D9] rounded p-5 mb-8 text-left text-xs space-y-2.5 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8E1D9]">
              <span className="text-stone-500">Review Status:</span>
              <Badge variant="Pending">Pending Review</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Transaction ID (TRX/TID):</span>
              <span className="font-mono font-bold text-stone-900">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Payment Method:</span>
              <span className="capitalize font-medium text-stone-900">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Amount:</span>
              <span className="font-serif font-bold text-sm text-[#581C24]">
                PKR {payment.amount?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Notification details */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded p-4 mb-8 text-left text-xs text-blue-900">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            As soon as an administrator verifies the screenshot, this story will automatically
            appear in <strong>My Library</strong> and the locked reader will become fully accessible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/account/library"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            <Library className="w-4 h-4" /> Go to My Library
          </Link>
          <Link
            to="/account/payments"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-[#E8E1D9] hover:bg-[#FAF8F5] text-stone-800 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            <CreditCard className="w-4 h-4" /> View Payment History
          </Link>
          <Link
            to="/stories"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-stone-600 hover:text-[#581C24] text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Browse More <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
