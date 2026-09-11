import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [search, setSearch] = useState('');

  // Review Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPayments({
        status,
        paymentMethod,
        search,
        limit: 50
      });
      if (res.success) setPayments(res.data);
    } catch (err) {
      toast.error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [status, paymentMethod]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const openReview = (p) => {
    setSelectedPayment(p);
    setReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setProcessing(true);
    try {
      const res = await adminService.approvePayment(selectedPayment._id);
      if (res.success) {
        toast.success(
          'Payment approved! Story entitlement created and unlocked for user.'
        );
        setReviewModalOpen(false);
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a clear rejection reason.');
      return;
    }

    setProcessing(true);
    try {
      const res = await adminService.rejectPayment(
        selectedPayment._id,
        rejectionReason.trim()
      );
      if (res.success) {
        toast.success('Payment rejected. Reason recorded for reader.');
        setRejectModalOpen(false);
        setReviewModalOpen(false);
        setSelectedPayment(null);
        setRejectionReason('');
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject payment.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D9]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Payment Verification Queue
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Review manual Easypaisa &amp; JazzCash receipts. Approve to grant instant story access.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TRX ID, name or phone..."
              className="w-full pl-9 pr-20 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded"
            >
              Filter
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Method:</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none"
            >
              <option value="all">All Methods</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E8E1D9] text-stone-500 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Story &amp; Price</th>
                  <th className="py-3 px-4">Reader Account</th>
                  <th className="py-3 px-4">Sender Name &amp; Phone</th>
                  <th className="py-3 px-4">Method &amp; TRX ID</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      <span className="font-serif font-bold text-sm block max-w-[180px] truncate">
                        {p.story?.title || 'Story'}
                      </span>
                      <span className="font-mono text-[11px] text-[#581C24]">
                        PKR {p.amount}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-700">
                      <span className="block font-medium">{p.user?.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {p.user?.email}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-stone-800 block">{p.senderName}</span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {p.senderPhone}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="uppercase font-bold text-stone-800 block">
                        {p.paymentMethod}
                      </span>
                      <span className="text-[#581C24] font-bold">{p.transactionId}</span>
                    </td>

                    <td className="py-3 px-4 text-stone-500 font-mono">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={p.status}>{p.status}</Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openReview(p)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#581C24] hover:bg-[#4A121A] rounded transition-colors shadow-2xs"
                      >
                        Review Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Payment Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Payment Verification & Audit"
        maxWidth="max-w-3xl"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: Full Screenshot Viewer */}
              <div>
                <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Uploaded Payment Receipt
                </p>
                <div className="border border-[#E8E1D9] rounded p-2 bg-stone-100 flex flex-col items-center">
                  <a
                    href={selectedPayment.screenshot}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative group overflow-hidden rounded"
                  >
                    <img
                      src={selectedPayment.screenshot}
                      alt="Receipt Proof"
                      className="max-h-80 object-contain rounded shadow-xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://placehold.co/400x500/EEE/31343C?text=Receipt+Screenshot';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <ExternalLink className="w-4 h-4" /> Open Full Screen
                    </div>
                  </a>
                  <span className="text-[10px] text-stone-500 mt-2 font-mono">
                    Click image to inspect full-resolution original
                  </span>
                </div>
              </div>

              {/* Right: Payment & Entitlement Data */}
              <div className="space-y-4">
                <div className="bg-[#FAF8F5] border border-[#E8E1D9] rounded p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E8E1D9]">
                    <span className="text-stone-500 font-medium">Verification Status:</span>
                    <Badge variant={selectedPayment.status}>{selectedPayment.status}</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Story to Unlock:</span>
                    <span className="font-serif font-bold text-stone-900 text-right">
                      {selectedPayment.story?.title}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Amount:</span>
                    <span className="font-serif font-bold text-base text-[#581C24]">
                      PKR {selectedPayment.amount?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Payment Method:</span>
                    <span className="uppercase font-bold font-mono">
                      {selectedPayment.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Transaction ID (TRX/TID):</span>
                    <span className="font-mono font-bold text-stone-900 bg-stone-200 px-1.5 py-0.5 rounded">
                      {selectedPayment.transactionId}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Sender Name:</span>
                    <span className="font-medium text-stone-900">
                      {selectedPayment.senderName}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">Sender Phone:</span>
                    <span className="font-mono text-stone-900">
                      {selectedPayment.senderPhone}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-stone-500">User Email:</span>
                    <span className="font-mono text-stone-600">
                      {selectedPayment.user?.email}
                    </span>
                  </div>

                  {selectedPayment.note && (
                    <div className="pt-2 border-t border-[#E8E1D9]">
                      <span className="text-stone-500 block mb-1">User Note:</span>
                      <p className="italic text-stone-700 bg-white p-2 rounded border border-stone-200">
                        "{selectedPayment.note}"
                      </p>
                    </div>
                  )}

                  {selectedPayment.rejectionReason && (
                    <div className="pt-2 border-t border-rose-200 text-rose-800">
                      <span className="font-bold block mb-1">Rejection Reason:</span>
                      <p className="bg-rose-50 p-2 rounded border border-rose-200">
                        {selectedPayment.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedPayment.status === 'Pending' ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Confirming approval will immediately create an active entitlement and
                      unlock the full story PDF in the user's library.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        disabled={processing}
                        className="py-2.5 px-4 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Reject Receipt
                      </button>

                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="py-2.5 px-4 bg-emerald-700 text-white hover:bg-emerald-800 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {processing ? (
                          'Verifying...'
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Approve Payment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-100 rounded text-xs text-stone-600 text-center font-mono">
                    This transaction was reviewed on{' '}
                    {new Date(selectedPayment.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Specify Payment Rejection Reason"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Please enter a clear explanation for why this payment proof could not be verified.
            This reason will be visible to the user so they can rectify their submission.
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction ID not found in bank statement, or amount transferred does not match story price."
              className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-rose-700 hover:bg-rose-800 rounded disabled:opacity-50"
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
