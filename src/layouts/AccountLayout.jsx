import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Library, CreditCard, User, LogOut, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export const AccountLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!(await logout())) return;
    toast.success('Signed out of your account.');
    navigate('/');
  };

  const navItems = [
    { name: 'My Library', path: '/account/library', icon: Library },
    { name: 'Payment History', path: '/account/payments', icon: CreditCard },
    { name: 'Profile Settings', path: '/account/profile', icon: User }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8E1D9] rounded-sm p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#581C24] text-[#DFC07A] flex items-center justify-center font-serif text-2xl font-bold border-2 border-[#C5A059]/40">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">{user?.name}</h1>
            <p className="text-xs text-stone-500">{user?.email} • Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>

        <Link
          to="/stories"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#581C24] hover:bg-[#4A121A] rounded shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5" /> Explore Stories
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Account Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white border border-[#E8E1D9] rounded-sm p-2 space-y-1 shadow-2xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#581C24] text-white font-semibold shadow-2xs'
                        : 'text-stone-700 hover:bg-[#FAF8F5] hover:text-[#581C24]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}

            <div className="pt-2 mt-2 border-t border-[#F3EFEA]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>
        </aside>

        {/* Content Outlet */}
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
