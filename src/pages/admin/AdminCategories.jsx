import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { apiUrl } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { Plus, Edit2, Trash2, FolderTree, AlertCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getCategories();
      if (!res.success) throw new Error('Failed to load categories.');
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageFile(null);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageFile(null);
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const openDeleteModal = (cat) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) {
      toast.error('Category name is required.');
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      toast.error('Use lowercase English letters, numbers and hyphens in the URL slug.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('slug', slug.trim());
      formData.append('description', description.trim());
      formData.append('isActive', isActive);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      let res;
      if (editingCategory) {
        res = await adminService.updateCategory(editingCategory._id, formData);
      } else {
        res = await adminService.createCategory(formData);
      }

      if (res.success) {
        toast.success(
          editingCategory ? 'Category updated.' : 'Category created successfully.'
        );
        setModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      const res = await adminService.deleteCategory(categoryToDelete._id);
      if (res.success) {
        toast.success('Category deleted successfully.');
        setDeleteModalOpen(false);
        setCategoryToDelete(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
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
            Category Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Organize stories into genres. Categories can only be deleted if not assigned to any story.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>

      {/* Categories Table */}
      {error && <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800">{error} <button onClick={fetchCategories} className="underline ml-2">Retry</button></div>}
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
                  <th className="py-3 px-4">Name &amp; Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Stories Count</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {!error && categories.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-stone-500">No categories yet. Create your first category to upload stories.</td></tr>}
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      <div>
                        <span className="font-serif text-sm font-bold text-stone-900">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono block">
                          /category/{c.slug}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-stone-600 max-w-sm truncate">
                      {c.description || 'No description provided.'}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-stone-700">
                      {c.storyCount || 0} stories
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit Category"
                          className="p-1.5 text-stone-400 hover:text-[#581C24] hover:bg-stone-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          title="Delete Category"
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { if (!submitting) setModalOpen(false); }}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Category Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingCategory) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^\w-]+/g, '')
                  );
                }
              }}
              placeholder="e.g. Mystery &amp; Suspense"
              className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. mystery-suspense"
              className="w-full p-2.5 text-xs font-mono border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for visitors..."
              className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-stone-300 text-[#581C24] focus:ring-[#581C24]"
              />
              <span>Category Enabled (Publicly visible)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">Category Image (Optional)
              <input type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs mt-2" onChange={(event) => {
                const file = event.target.files[0];
                if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
                  toast.error('Use a JPG, PNG or WebP image up to 10MB.');
                  event.target.value = '';
                  return;
                }
                setImageFile(file || null);
              }} />
            </label>
            {editingCategory?.image && <img src={apiUrl(editingCategory.image)} alt="Current category" className="w-20 h-20 object-cover rounded mt-2" />}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F3EFEA]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] hover:bg-[#4A121A] rounded disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Category Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Delete Verification</p>
              <p className="mt-0.5 leading-relaxed">
                Are you sure you want to delete category "<strong>{categoryToDelete?.name}</strong>"?
                If there are any stories linked to it, deletion will be safely rejected.
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
