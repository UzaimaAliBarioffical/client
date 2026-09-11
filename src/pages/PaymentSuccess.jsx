import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, Link, Navigate } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { paymentService } from '../services/paymentService';
import { CheckCircle2, Clock, Library, CreditCard, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

export const PaymentSuccess = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment') || location.state?.payment?._id;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!paymentId) return;
    let active = true;
    setLoading(true);
    setError('');
    paymentService.getPaymentById(paymentId).then((res) => {
      if (!res.success || !res.data) throw new Error('Payment record is unavailable.');
      if (active) setPayment(res.data);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'Could not load your payment status.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [paymentId, refresh]);

  if (!paymentId) return <Navigate to="/account/payments" replace />;
  const approved = payment?.status === 'Approved';
  const rejected = payment?.status === 'Rejected';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 sm:p-10 shadow-sm">
        {loading ? <div role="status" className="py-12 text-sm text-stone-600">Loading payment status...</div> : error ? (
          <div role="alert" className="space-y-4 py-6">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <p className="text-sm text-rose-800">{error}</p>
          </div>
        ) : payment && (
          <>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${approved ? 'bg-emerald-100 text-emerald-600' : rejected ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>
              {approved ? <CheckCircle2 className="w-9 h-9" /> : rejected ? <AlertCircle className="w-9 h-9" /> : <Clock className="w-9 h-9" />}
            </div>
            <Badge variant={payment.status}>{payment.status}</Badge>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-4 mb-3">
              {approved ? 'Your Story Is Unlocked' : rejected ? 'Your Payment Could Not Be Verified' : 'Your Payment Is Under Review'}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed mb-6">
              {approved ? 'Your approved purchase is available in My Library.' : rejected ? 'Please read the review reason before submitting new proof.' : 'Your receipt has been submitted. An administrator must verify the transaction and approve it before this story unlocks.'}
            </p>
            <div className="bg-[#FAF8F5] border border-[#E8E1D9] rounded p-4 sm:p-5 mb-6 text-left text-xs space-y-3">
              <div className="flex flex-wrap justify-between gap-2"><span className="text-stone-500">Story:</span><strong className="break-words">{payment.story?.title || 'Story unavailable'}</strong></div>
              <div className="flex flex-wrap justify-between gap-2"><span className="text-stone-500">Transaction ID:</span><strong className="font-mono break-all">{payment.transactionId}</strong></div>
              <div className="flex justify-between gap-2"><span className="text-stone-500">Payment Method:</span><span className="capitalize">{payment.paymentMethod}</span></div>
              <div className="flex justify-between gap-2"><span className="text-stone-500">Amount:</span><strong className="text-[#581C24]">PKR {payment.amount?.toLocaleString()}</strong></div>
            </div>
            {rejected && <p role="status" className="bg-rose-50 border border-rose-200 text-rose-900 rounded p-4 mb-6 text-sm text-left">{payment.rejectionReason || 'Contact support for the review details.'}</p>}
            {approved && payment.story && <Link to={`/story/${payment.story.slug}/read`} className="inline-block bg-[#581C24] text-white rounded px-6 py-3 text-sm mb-6">Read Full Story</Link>}
            {rejected && payment.story && <Link to={`/checkout/${payment.story._id}`} className="inline-block bg-[#581C24] text-white rounded px-6 py-3 text-sm mb-6">Submit New Proof</Link>}
          </>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <button disabled={loading} onClick={() => setRefresh((value) => value + 1)} className="inline-flex items-center gap-2 border border-[#E8E1D9] rounded px-4 py-2.5 hover:bg-[#FAF8F5] disabled:opacity-50"><RefreshCw className="w-4 h-4" />Refresh Status</button>
          <Link to="/account/library" className="inline-flex items-center gap-2 px-4 py-2.5 text-[#581C24]"><Library className="w-4 h-4" />My Library</Link>
          <Link to="/account/payments" className="inline-flex items-center gap-2 px-4 py-2.5 text-[#581C24]"><CreditCard className="w-4 h-4" />Payment History</Link>
          <Link to="/stories" className="inline-flex items-center gap-2 px-4 py-2.5 text-stone-600">Browse More<ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>
    </div>
  );
};
