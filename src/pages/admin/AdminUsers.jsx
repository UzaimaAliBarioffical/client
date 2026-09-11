import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/common/Badge';
import { Search, UserCheck, UserX, Shield, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ search, role, limit: 50 });
      if (res.success) setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await adminService.toggleUserStatus(user._id);
      if (res.success) {
        toast.success(res.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D9]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            User Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Registered readers and platform administrators. Toggle access status when necessary.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-20 py-2 text-xs border border-[#E8E1D9] rounded focus:outline-none focus:border-[#581C24]"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-medium">Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-2 text-xs border border-[#E8E1D9] bg-white rounded focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">Reader Users</option>
            <option value="admin">Staff Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
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
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EFEA]">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {u.name}
                    </td>

                    <td className="py-3 px-4 font-mono text-stone-600">
                      {u.email}
                    </td>

                    <td className="py-3 px-4 font-mono text-stone-600">
                      {u.phone || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-stone-500 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
