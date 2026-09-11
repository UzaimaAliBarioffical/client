import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  CreditCard,
  Users,
  Settings,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!(await logout())) return;
    toast.success('Logged out of Admin Portal.');
    navigate('/admin/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin', exact: true, icon: LayoutDashboard },
    { name: 'Story Management', path: '/admin/stories', icon: BookOpen },
    { name: 'Category Management', path: '/admin/categories', icon: FolderTree },
    { name: 'Payment Reviews', path: '/admin/payments', icon: CreditCard },
    { name: 'User Directory', path: '/admin/users', icon: Users },
    { name: 'Payment Settings', path: '/admin/payment-settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#141211] text-[#E8E1D9] border-r border-stone-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col justify-between p-4">
          <div>
            {/* Admin Header */}
            <div className="flex items-center justify-between px-2 py-3 border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#581C24] text-[#DFC07A] flex items-center justify-center font-serif text-lg font-bold border border-[#C5A059]/40">
                  Q
                </div>
                <div>
                  <span className="font-serif text-lg font-bold tracking-tight text-white block">
                    QissaGhar
                  </span>
                  <span className="text-[10px] text-[#DFC07A] tracking-wider uppercase font-mono block">
                    Admin Portal
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-6 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#581C24] text-white font-semibold'
                          : 'text-stone-400 hover:bg-stone-900 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-stone-800 pt-4 space-y-3">
            <Link
              to="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-900 rounded transition-colors"
            >
              <span>View Live Website</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <div className="px-3 py-2 bg-stone-900 rounded flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="text-stone-400 hover:text-red-400 p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E8E1D9] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-stone-700 hover:text-[#581C24]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privileged Administrator Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-600 hover:text-[#581C24] font-medium"
            >
              Back to Site <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
