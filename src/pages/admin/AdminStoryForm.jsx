import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { storyService } from '../../services/storyService';
import {
  Upload,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminStoryForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('Urdu');
  const [price, setPrice] = useState(350);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState('published');

  // File states
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [existingPdfInfo, setExistingPdfInfo] = useState('');

  // Auto-slug generator
  const generateSlug = (val) => {
    return val
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEdit) {
      setSlug(generateSlug(val));
    }
  };

  useEffect(() => {
    // Load categories
    adminService.getCategories().then((res) => {
      if (res.success) {
        setCategories(res.data);
        if (!isEdit && res.data.length > 0) {
          setCategory(res.data[0]._id);
        }
      }
    });

    // If edit, load existing story
    if (isEdit) {
      adminService.getStories().then((res) => {
        if (res.success) {
          const found = res.data.find((s) => s._id === id);
          if (found) {
            setTitle(found.title);
            setSlug(found.slug);
            setAuthor(found.author);
            setCategory(found.category?._id || found.category);
            setLanguage(found.language || 'Urdu');
            setPrice(found.price);
            setShortDescription(found.shortDescription);
            setDescription(found.description);
            setTags(found.tags ? found.tags.join(', ') : '');
            setIsFeatured(found.isFeatured);
            setStatus(found.status);
            setExistingCoverUrl(found.coverImage);
            setExistingPdfInfo(`${found.totalPages} pages currently configured`);
          }
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only valid PDF files are allowed.');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !author.trim() || !category) {
      toast.error('Please enter title, author, and select category.');
      return;
    }

    if (!isEdit && (!coverFile || !pdfFile)) {
      toast.error('Both cover image and PDF story file are required for new stories.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('slug', slug.trim());
      formData.append('author', author.trim());
      formData.append('category', category);
      formData.append('language', language);
      formData.append('price', price);
      formData.append('shortDescription', shortDescription.trim());
      formData.append('description', description.trim());
      formData.append('tags', tags);
      formData.append('isFeatured', isFeatured);
      formData.append('status', status);

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }
      if (pdfFile) {
        formData.append('pdfFile', pdfFile);
      }

      let res;
      if (isEdit) {
        res = await adminService.updateStory(id, formData);
      } else {
        res = await adminService.createStory(formData);
      }

      if (res.success) {
        toast.success(
          isEdit
            ? 'Story updated successfully.'
            : 'Story created! 2-page preview and private storage configured.'
        );
        navigate('/admin/stories');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save story.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D9]">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/stories"
            className="p-2 text-stone-500 hover:text-stone-900 rounded-sm hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              {isEdit ? 'Edit Story' : 'Upload New Story'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Configure literary metadata, price, and secure PDF preview generation.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Story Details */}
        <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs space-y-4">
          <h2 className="font-serif text-base font-bold text-stone-900 border-b border-[#F3EFEA] pb-2">
            1. Book Details &amp; Author
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Story Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Ishq e Majazi"
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
                placeholder="e.g. ishq-e-majazi"
                className="w-full p-2.5 text-xs font-mono border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Author Name *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Farida Bano"
                className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none focus:border-[#581C24]"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none focus:border-[#581C24]"
              >
                <option value="Urdu">Urdu</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Price (PKR) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 text-xs font-serif font-bold text-stone-900 border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none focus:border-[#581C24]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-stone-300 text-[#581C24] focus:ring-[#581C24]"
                />
                <span>Feature on Homepage</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Short Description (Synopsis teaser) *
            </label>
            <input
              type="text"
              required
              maxLength={500}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="1-2 sentences capturing reader attention..."
              className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Full Description / Synopsis *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed background, context, and storyline overview..."
              className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. romance, mystery, lahore, suspense"
              className="w-full p-2.5 text-xs font-mono border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>
        </div>

        {/* File Uploads (Cover & PDF) */}
        <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs space-y-6">
          <h2 className="font-serif text-base font-bold text-stone-900 border-b border-[#F3EFEA] pb-2">
            2. Cover Artwork &amp; Story PDF Document
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Cover Artwork {isEdit ? '(Leave empty to keep current)' : '*'}
              </label>

              {coverPreview || existingCoverUrl ? (
                <div className="relative border border-[#E8E1D9] rounded p-2 bg-[#FAF8F5] flex items-center gap-3">
                  <img
                    src={
                      coverPreview ||
                      (existingCoverUrl?.startsWith('http')
                        ? existingCoverUrl
                        : `/${existingCoverUrl.replace(/\\/g, '/')}`)
                    }
                    alt="Cover preview"
                    className="w-16 h-22 object-cover rounded border border-stone-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-800 truncate">
                      {coverFile ? coverFile.name : 'Current Cover Image'}
                    </p>
                    <label className="mt-2 inline-block text-xs text-[#581C24] font-semibold cursor-pointer hover:underline">
                      Change File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#581C24] rounded-sm p-6 flex flex-col items-center justify-center cursor-pointer bg-[#FAF8F5] transition-colors">
                  <ImageIcon className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-semibold text-stone-700">
                    Upload Story Cover Image
                  </span>
                  <span className="text-[10px] text-stone-500 mt-1 font-mono">
                    JPG, PNG, WebP or SVG up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Story PDF File Upload */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Original Story PDF {isEdit ? '(Leave empty to keep current)' : '*'}
              </label>

              {pdfFile || existingPdfInfo ? (
                <div className="border border-[#E8E1D9] rounded p-4 bg-[#FAF8F5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#581C24]/10 text-[#581C24] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-stone-800">
                        {pdfFile ? pdfFile.name : 'Current Attached PDF File'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-mono">
                        {pdfFile
                          ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for preview extraction`
                          : existingPdfInfo}
                      </p>
                    </div>
                  </div>

                  <label className="text-xs text-[#581C24] font-semibold cursor-pointer hover:underline">
                    Replace PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#581C24] rounded-sm p-6 flex flex-col items-center justify-center cursor-pointer bg-[#FAF8F5] transition-colors">
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-semibold text-stone-700">
                    Upload Full Story PDF
                  </span>
                  <span className="text-[10px] text-stone-500 mt-1 font-mono">
                    Valid PDF up to 50MB
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                </label>
              )}

              <div className="mt-3 p-3 bg-stone-100 rounded text-[11px] text-stone-600 leading-relaxed">
                <span className="font-semibold text-stone-800">Automatic PDF Security:</span> The
                server automatically determines page counts and extracts a separate 2-page preview
                file. The full PDF is guarded from direct public access.
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E1D9]">
          <Link
            to="/admin/stories"
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Processing &amp; Generating Preview...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Upload &amp; Publish Story'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
