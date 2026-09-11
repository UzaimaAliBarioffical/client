import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { apiUrl } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  BookOpen,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStories = async () => {
    const request = ++requestVersion.current;
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getStories({ search: submittedSearch, page, limit: 15 });
      if (request !== requestVersion.current) return;
      if (!res.success) throw new Error('Failed to load stories.');
      setStories(res.data);
      setPagination(res.pagination || { total: res.data.length, totalPages: 1 });
    } catch (err) {
      if (request === requestVersion.current) setError(err.response?.data?.message || 'Failed to load stories.');
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [page, submittedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  const confirmDelete = (story) => {
    setStoryToDelete(story);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;
    setDeleting(true);
    try {
      const res = await adminService.deleteStory(storyToDelete._id);
      if (res.success) {
        toast.success('Story and associated PDFs deleted successfully.');
        setDeleteModalOpen(false);
        setStoryToDelete(null);
        if (stories.length === 1 && page > 1) setPage(page - 1);
        else fetchStories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete story.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D9]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Story Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Upload PDFs, configure preview chapters, manage pricing and publication state.
          </p>
        </div>

        <Link
          to="/admin/stories/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add New Story
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories by title or author..."
            className="w-full pl-9 pr-20 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded"
          >
            Filter
          </button>
        </form>

        <span className="text-xs text-stone-500 font-mono">
          {pagination.total} stories found
        </span>
      </div>

      {/* Stories Table */}
      {error && <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800">{error} <button onClick={fetchStories} className="underline ml-2">Retry</button></div>}
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
                  <th className="py-3 px-4">Story &amp; Cover</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (PKR)</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {!error && stories.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-stone-500">No stories found. Upload a story to get started.</td></tr>}
                {stories.map((s) => {
                  const coverUrl = s.coverImage ? apiUrl(s.coverImage) : '/placeholder-cover.svg';

                  return (
                    <tr key={s._id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverUrl}
                            alt={s.title}
                            loading="lazy"
                            decoding="async"
                            className="w-10 h-13 object-cover rounded border border-[#E8E1D9] shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-serif font-bold text-sm text-stone-900 truncate max-w-[220px]">
                              {s.title}
                            </h4>
                            <p className="text-stone-500 text-[11px] truncate max-w-[200px]">
                              By {s.author} • {s.language}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E8E1D9] rounded">
                          {s.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-serif font-bold text-stone-900">
                        {s.price > 0 ? `PKR ${s.price}` : 'FREE'}
                      </td>

                      <td className="py-3 px-4 font-mono text-stone-600">
                        {s.totalPages} pgs (2 free)
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={s.status}>{s.status}</Badge>
                      </td>

                      <td className="py-3 px-4">
                        {s.isFeatured ? (
                          <Badge variant="gold" size="xs">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </Badge>
                        ) : (
                          <span className="text-stone-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/story/${s.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View Story Page"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/stories/${s._id}/edit`}
                            title="Edit Story"
                            className="p-1.5 text-stone-400 hover:text-[#581C24] hover:bg-stone-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => confirmDelete(s)}
                            title="Delete Story"
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} />}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Story Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Permanent Deletion Warning</p>
              <p className="mt-0.5 leading-relaxed">
                This will permanently delete "<strong>{storyToDelete?.title}</strong>" and its
                associated full private PDF and 2-page preview files from storage.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-red-700 hover:bg-red-800 rounded disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
