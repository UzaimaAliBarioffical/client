import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { apiUrl } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CreditCard, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccountPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    paymentService.getUserPayments().then((res) => {
      if (!res.success) throw new Error('Could not load payments.');
      if (active) setPayments(res.data);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'Could not load payment history. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F3EFEA] mb-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">Payment Submissions</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Track your manual Easypaisa &amp; JazzCash transaction verification requests.
          </p>
        </div>
        <span className="text-xs font-mono bg-[#FAF8F5] border border-[#E8E1D9] px-2.5 py-1 rounded text-stone-600">
          {payments.length} Transactions
        </span>
        <button onClick={() => setRefresh((value) => value + 1)} className="text-xs text-[#581C24] underline">Refresh Status</button>
      </div>

      {error ? <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800">{error}</div> : payments.length === 0 ? (
        <EmptyState
          title="No payment submissions found"
          message="You haven't submitted any manual payment verification requests yet."
          actionText="Explore Stories"
          actionLink="/stories"
        />
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div
              key={p._id}
              className="border border-[#E8E1D9] rounded-sm p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-stone-400 transition-colors"
            >
              {/* Left Column: Story Details & Status */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                {p.story && (
                  <img
                    src={p.story.coverImage ? apiUrl(p.story.coverImage) : '/placeholder-cover.svg'}
                    alt={p.story.title}
                    loading="lazy"
                    decoding="async"
                    className="w-14 aspect-[3/4] object-cover rounded border border-[#E8E1D9] shrink-0"
                  />
                )}
                <div className="space-y-1 min-w-0 break-words">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif text-base font-bold text-stone-900">
                      {p.story?.title || 'Story Unavailable'}
                    </h4>
                    <Badge variant={p.status}>{p.status}</Badge>
                  </div>

                  <p className="text-xs text-stone-500 font-mono">
                    Method: <span className="capitalize font-semibold text-stone-700">{p.paymentMethod}</span> • TRX/TID:{' '}
                    <span className="font-bold text-[#581C24] break-all">{p.transactionId}</span>
                  </p>

                  <p className="text-[11px] text-stone-400">
                    Submitted on {new Date(p.createdAt).toLocaleDateString()} at{' '}
                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Rejection Notice if applicable */}
                  {p.status === 'Rejected' && p.rejectionReason && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold">Rejection Reason:</strong>{' '}
                        {p.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Amount & Action */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#F3EFEA] gap-2">
                <span className="font-serif text-lg font-bold text-[#581C24]">
                  PKR {p.amount?.toLocaleString()}
                </span>
                <Link to={`/payment/success?payment=${p._id}`} className="text-xs underline text-[#581C24]">View Status</Link>

                {p.status === 'Approved' && p.story && (
                  <Link
                    to={`/story/${p.story.slug}/read`}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                  >
                    Read Story
                  </Link>
                )}

                {p.status === 'Pending' && (
                  <span className="text-[11px] text-amber-700 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Awaiting Review
                  </span>
                )}

                {p.status === 'Rejected' && p.story && (
                  <Link
                    to={`/checkout/${p.story._id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                  >
                    Resubmit Proof
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
