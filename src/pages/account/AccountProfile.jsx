import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { User, Phone, Mail, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const AccountProfile = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/api/users/me', { name, phone });
      if (res.data.success) {
        updateProfile(res.data.user);
        toast.success('Profile updated successfully.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 shadow-2xs max-w-2xl">
      <div className="pb-4 border-b border-[#F3EFEA] mb-6">
        <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">Profile Information</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Update your personal details and contact information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Email Address (Non-editable)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded text-stone-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Account Role
          </label>
          <div className="relative">
            <Shield className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              disabled
              value={user?.role?.toUpperCase() || 'USER'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded text-stone-500 font-mono font-semibold cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Phone Number (for payment confirmations)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03001234567"
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#581C24] hover:bg-[#4A121A] text-white text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
