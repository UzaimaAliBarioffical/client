import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { storyService } from '../services/storyService';
import { apiUrl } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  CreditCard,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Image as ImageIcon,
  X,
  FileText,
  User,
  Phone,
  Hash,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Checkout = () => {
  const { storyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderPhone, setSenderPhone] = useState(user?.phone || '');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  useEffect(() => {
    let active = true;
    const loadCheckoutData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [methodsRes, storyRes, paymentsRes] = await Promise.all([
          paymentService.getPaymentMethods(),
          storyService.getStoryById(storyId),
          paymentService.getUserPayments()
        ]);
        if (!active) return;
        if (!methodsRes.success || !storyRes.success || !storyRes.data) throw new Error('Checkout information is unavailable.');
        const found = storyRes.data;
        if (found.hasAccess || found.price === 0) {
          navigate(`/story/${found.slug}/read`, { replace: true });
          return;
        }
        const pending = paymentsRes.data?.find((payment) => payment.story?._id === storyId && payment.status === 'Pending');
        if (pending) {
          navigate(`/payment/success?payment=${pending._id}`, { replace: true });
          return;
        }
        const enabled = methodsRes.data.filter((method) => method.isEnabled && method.accountTitle && method.accountNumber);
        setMethods(enabled);
        setSelectedMethod(enabled[0]?.method || '');
        setStory(found);
        if (!enabled.length) setError('Payments are temporarily unavailable. Please check again after the payment accounts have been configured.');
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'Failed to initialize checkout information.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCheckoutData();
    return () => { active = false; };
  }, [storyId, navigate]);

  useEffect(() => {
    if (!screenshotFile) { setScreenshotPreview(null); return; }
    const url = URL.createObjectURL(screenshotFile);
    setScreenshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshotFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only image files (JPG, PNG, WebP) are supported for screenshot.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Screenshot file must be under 10MB.');
        return;
      }
      setScreenshotFile(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !story || !methods.some((method) => method.method === selectedMethod)) return;

    if (!senderName.trim() || !senderPhone.trim() || !transactionId.trim()) {
      toast.error('Please fill in all sender details and Transaction ID.');
      return;
    }

    if (!screenshotFile) {
      toast.error('Please upload a screenshot of your payment transfer receipt.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('storyId', story._id);
      formData.append('amount', story.price);
      formData.append('paymentMethod', selectedMethod);
      formData.append('senderName', senderName.trim());
      formData.append('senderPhone', senderPhone.trim());
      formData.append('transactionId', transactionId.trim());
      formData.append('paymentDate', paymentDate);
      formData.append('note', note.trim());
      formData.append('screenshot', screenshotFile);

      const res = await paymentService.submitPayment(formData);

      if (res.success) {
        toast.success('Payment submitted for verification!');
        navigate(`/payment/success?payment=${res.data._id}`, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to submit payment. Please verify your details.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-[#581C24]/20 border-t-[#581C24] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E8E1D9] text-center rounded-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Checkout Error</h2>
        <p className="text-xs text-stone-600 mb-6">{error || 'Story not found.'}</p>
        <Link
          to="/stories"
          className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] rounded"
        >
          Return to Stories
        </Link>
      </div>
    );
  }

  const currentSetting = methods.find((m) => m.method === selectedMethod);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-[#E8E1D9]">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
          Unlock Full Story Access
        </h1>
        <p className="text-sm text-stone-600 mt-1 font-sans">
          Manual payment verification via Easypaisa or JazzCash.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payment Instructions & Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Method */}
          <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#581C24] text-white flex items-center justify-center text-xs font-mono">
                1
              </span>
              Select Payment Method
            </h3>

            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
              {methods.map((m) => (
                <button
                  key={m.method}
                  type="button"
                  aria-pressed={selectedMethod === m.method}
                  onClick={() => setSelectedMethod(m.method)}
                  className={`p-4 border rounded text-left transition-all flex flex-col justify-between ${
                    selectedMethod === m.method
                      ? 'border-[#581C24] bg-[#581C24]/5 ring-1 ring-[#581C24]'
                      : 'border-[#E8E1D9] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-base font-bold capitalize text-stone-900">
                      {m.method}
                    </span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedMethod === m.method
                          ? 'border-[#581C24] bg-[#581C24]'
                          : 'border-stone-300'
                      }`}
                    >
                      {selectedMethod === m.method && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Direct Mobile Transfer
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Account Transfer Instructions */}
          <div className="bg-[#FAF8F5] border border-[#DFC07A]/50 rounded-sm p-6 shadow-2xs">
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#581C24] text-white flex items-center justify-center text-xs font-mono">
                2
              </span>
              Transfer to Account
            </h3>

            <div className="bg-white border border-[#E8E1D9] rounded p-4 mb-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Payment Service:</span>
                <span className="font-bold text-stone-900 uppercase font-mono">
                  {selectedMethod}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Account Title:</span>
                <span className="font-bold text-stone-900">{currentSetting.accountTitle}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500 font-medium">Account Number / Phone:</span>
                <span className="font-mono font-bold text-base text-[#581C24] tracking-wider select-all">
                  {currentSetting.accountNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-[#F3EFEA]">
                <span className="text-stone-500 font-medium">Exact Amount:</span>
                <span className="font-serif font-bold text-base text-stone-900">
                  PKR {story.price.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-sans bg-amber-50/70 p-3 rounded border border-amber-200">
              <strong>Instructions:</strong> {currentSetting.instructions}
            </p>
            {currentSetting.qrImage && <img src={apiUrl(currentSetting.qrImage)} alt={`${selectedMethod} payment QR code`} className="w-40 h-40 object-contain mx-auto mt-4 border border-[#E8E1D9] rounded" />}
          </div>

          {/* Step 3: Proof Submission Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs space-y-5"
          >
            <h3 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#581C24] text-white flex items-center justify-center text-xs font-mono">
                3
              </span>
              Enter Sender Details &amp; Upload Receipt
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Sender Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Name registered on bank account"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Sender Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="0300XXXXXXX"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Transaction ID (TRX / TID) *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 19283746501"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-stone-900 border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    max={new Date().toLocaleDateString('en-CA')}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
                  />
                </div>
              </div>
            </div>

            {/* Screenshot Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Payment Proof Screenshot *
              </label>

              {screenshotPreview ? (
                <div className="relative border border-[#E8E1D9] rounded p-2 bg-[#FAF8F5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={screenshotPreview}
                      alt="Payment proof preview"
                      className="w-16 h-16 object-cover rounded border border-stone-300"
                    />
                    <div>
                      <p className="text-xs font-medium text-stone-800 truncate max-w-[200px]">
                        {screenshotFile?.name}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {(screenshotFile?.size / 1024).toFixed(1)} KB • Image Attached
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                    title="Remove screenshot"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#581C24] rounded-sm p-6 flex flex-col items-center justify-center cursor-pointer bg-[#FAF8F5] transition-colors">
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-semibold text-stone-700">
                    Click to browse payment screenshot
                  </span>
                  <span className="text-[10px] text-stone-500 mt-1 font-mono">
                    PNG, JPG, or WebP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Optional Note for Reviewer
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any relevant remarks about your transfer..."
                className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting Receipt...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#DFC07A]" />
                  <span>Submit Payment Verification</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#1A1A1A] border-b border-[#F3EFEA] pb-3">
              Order Summary
            </h3>

            <div className="flex gap-4 items-start">
              <img
                src={story.coverImage ? apiUrl(story.coverImage) : '/placeholder-cover.svg'}
                alt={story.title}
                className="w-20 aspect-[3/4] object-cover rounded border border-[#E8E1D9] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-[#581C24] uppercase tracking-wider block">
                  {story.category?.name || 'Story'}
                </span>
                <h4 className="font-serif text-base font-bold text-stone-900 truncate">
                  {story.title}
                </h4>
                <p className="text-xs text-stone-500">By {story.author}</p>
                <p className="text-xs text-stone-400 font-mono mt-1">
                  {story.totalPages} Pages • {story.language}
                </p>
              </div>
            </div>

            <div className="border-t border-[#F3EFEA] pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Story Unabridged Edition</span>
                <span>PKR {story.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Digital Delivery</span>
                <span className="text-emerald-600 font-semibold">After approval</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Account Library Storage</span>
                <span className="text-emerald-600 font-semibold">Lifetime Access</span>
              </div>
              <div className="border-t border-[#E8E1D9] pt-3 flex justify-between items-baseline font-bold text-stone-900">
                <span className="text-sm">Total Payable</span>
                <span className="font-serif text-2xl text-[#581C24]">
                  PKR {story.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded border border-[#E8E1D9] space-y-2 text-[11px] text-stone-500">
              <p className="flex items-center gap-1.5 font-medium text-stone-700">
                <Clock className="w-3.5 h-3.5 text-[#581C24]" /> Manual Verification
              </p>
              <p className="leading-relaxed">
                Your payment stays pending until an administrator checks the transaction and approves it.
                Only this story will then unlock in your "My Library" dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
