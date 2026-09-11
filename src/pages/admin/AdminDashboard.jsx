import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/common/Badge';
import {
  BookOpen,
  FolderTree,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ArrowRight,
  Eye,
  Plus
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard().then((res) => {
      if (res.success) setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Verified Revenue',
      value: `PKR ${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtitle: `${stats?.approvedPayments || 0} approved orders`,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Pending Reviews',
      value: stats?.pendingPayments || 0,
      subtitle: 'Awaiting TRX verification',
      icon: Clock,
      color: 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20'
    },
    {
      title: 'Total Stories',
      value: stats?.totalStories || 0,
      subtitle: `${stats?.publishedStories || 0} published`,
      icon: BookOpen,
      color: 'bg-[#FAF8F5] text-stone-900 border-[#E8E1D9]'
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers || 0,
      subtitle: 'Active reader accounts',
      icon: Users,
      color: 'bg-[#FAF8F5] text-stone-900 border-[#E8E1D9]'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D9]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Platform Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time metrics, payment review queues, and publishing distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/stories/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Story
          </Link>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E8E1D9] hover:bg-[#FAF8F5] text-stone-700 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            <CreditCard className="w-4 h-4 text-[#581C24]" /> Review Payments (
            {stats?.pendingPayments || 0})
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`p-5 rounded-sm border shadow-2xs flex items-start justify-between ${c.color}`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 font-mono">
                  {c.title}
                </p>
                <p className="font-serif text-2xl sm:text-3xl font-bold mt-2">{c.value}</p>
                <p className="text-xs mt-1 opacity-80">{c.subtitle}</p>
              </div>
              <div className="p-2.5 rounded bg-white/80 border border-black/5">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle: Pending Payments Queue & Category Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Payments Review Queue */}
        <div className="lg:col-span-8 bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#F3EFEA] mb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Recent Payment Submissions
              </h2>
              <p className="text-xs text-stone-500">
                Awaiting manual verification or recently processed.
              </p>
            </div>
            <Link
              to="/admin/payments"
              className="text-xs font-semibold text-[#581C24] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recentPayments?.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-8">
              No payments submitted yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#E8E1D9] text-stone-400 uppercase font-mono">
                    <th className="py-2.5 px-3">Story</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Method &amp; TRX</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EFEA]">
                  {stats?.recentPayments?.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-3 font-semibold text-stone-900 max-w-[150px] truncate">
                        {p.story?.title || 'Story'}
                      </td>
                      <td className="py-3 px-3 text-stone-600">
                        <span className="block truncate max-w-[120px]">{p.user?.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {p.user?.email}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="uppercase font-bold text-stone-700 block">
                          {p.paymentMethod}
                        </span>
                        <span className="text-[10px] text-[#581C24]">{p.transactionId}</span>
                      </td>
                      <td className="py-3 px-3 font-serif font-bold text-stone-900">
                        PKR {p.story?.price || 0}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={p.status}>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/payments`}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Breakdown & Revenue */}
        <div className="lg:col-span-4 space-y-6">
          {/* Category Distribution */}
          <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs">
            <h3 className="font-serif text-base font-bold text-stone-900 pb-3 border-b border-[#F3EFEA] mb-4 flex items-center justify-between">
              <span>Category Distribution</span>
              <FolderTree className="w-4 h-4 text-stone-400" />
            </h3>
            <div className="space-y-3">
              {stats?.categoryStats?.map((c) => (
                <div key={c._id} className="flex items-center justify-between text-xs">
                  <span className="text-stone-700 font-medium">{c.name}</span>
                  <span className="font-mono px-2 py-0.5 bg-[#FAF8F5] border border-[#E8E1D9] rounded text-stone-600">
                    {c.count} stories
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status Summary */}
          <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs space-y-3">
            <h3 className="font-serif text-base font-bold text-stone-900 pb-3 border-b border-[#F3EFEA]">
              Audit Statistics
            </h3>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-amber-700">
                <Clock className="w-3.5 h-3.5" /> Pending Queue
              </span>
              <span className="font-mono font-bold text-amber-700">
                {stats?.pendingPayments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved Entitlements
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {stats?.approvedPayments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-rose-700">
                <XCircle className="w-3.5 h-3.5" /> Rejected Submissions
              </span>
              <span className="font-mono font-bold text-rose-700">
                {stats?.rejectedPayments || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
