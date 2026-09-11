import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { adminService } from '../../services/adminService';
import { Settings, Save, Upload, CheckCircle2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminPaymentSettings = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPaymentMethods();
      if (res.success) setMethods(res.data);
    } catch (err) {
      toast.error('Failed to load payment settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (methodName, formData) => {
    setSavingMethod(methodName);
    try {
      const res = await adminService.updatePaymentSetting(methodName, formData);
      if (res.success) {
        toast.success(`${methodName.toUpperCase()} settings saved successfully.`);
        fetchSettings();
      }
    } catch (err) {
      toast.error('Failed to update payment settings.');
    } finally {
      setSavingMethod(null);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#E8E1D9]">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
          Payment Method Configurations
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Manage Easypaisa and JazzCash recipient accounts, user transfer instructions, and QR codes.
        </p>
      </div>

      <div className="space-y-8">
        {methods.map((m) => (
          <PaymentSettingCard
            key={m.method}
            setting={m}
            onSave={(formData) => handleUpdate(m.method, formData)}
            isSaving={savingMethod === m.method}
          />
        ))}
      </div>
    </div>
  );
};

const PaymentSettingCard = ({ setting, onSave, isSaving }) => {
  const [accountTitle, setAccountTitle] = useState(setting.accountTitle || '');
  const [accountNumber, setAccountNumber] = useState(setting.accountNumber || '');
  const [instructions, setInstructions] = useState(setting.instructions || '');
  const [isEnabled, setIsEnabled] = useState(setting.isEnabled ?? true);
  const [qrFile, setQrFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('accountTitle', accountTitle.trim());
    formData.append('accountNumber', accountNumber.trim());
    formData.append('instructions', instructions.trim());
    formData.append('isEnabled', isEnabled);
    if (qrFile) {
      formData.append('qrImage', qrFile);
    }
    onSave(formData);
  };

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#F3EFEA]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#581C24]" />
          <h3 className="font-serif text-lg font-bold uppercase tracking-wide text-stone-900">
            {setting.method} Configuration
          </h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="rounded border-stone-300 text-[#581C24] focus:ring-[#581C24]"
          />
          <span className={isEnabled ? 'text-emerald-700' : 'text-stone-400'}>
            {isEnabled ? 'Enabled for Customers' : 'Disabled'}
          </span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Account Title *
            </label>
            <input
              type="text"
              required
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Account Number / Phone *
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-2.5 text-xs font-mono font-bold text-stone-900 border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Payment Instructions for Customer
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full p-2.5 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            QR Code Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setQrFile(e.target.files[0])}
            className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save {setting.method.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
