import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  FolderTree,
  ShieldAlert,
  CreditCard,
  Library
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'All Stories', path: '/stories' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E1D9] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-sm bg-[#581C24] text-[#DFC07A] flex items-center justify-center font-serif text-2xl font-bold shadow-xs transition-transform group-hover:scale-105 border border-[#C5A059]/40">
              Q
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A] group-hover:text-[#581C24] transition-colors">
                Qissa<span className="text-[#581C24]">Ghar</span>
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#8C827A] font-sans font-medium">
                Premium Stories &amp; Afsane
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-[#581C24] relative py-1 ${
                  isActive(link.path)
                    ? 'text-[#581C24] font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#581C24]'
                    : 'text-[#4A4A4A]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* User Library Quick Link */}
                <Link
                  to="/account/library"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#581C24] bg-[#581C24]/10 hover:bg-[#581C24]/15 rounded border border-[#581C24]/20 transition-colors"
                >
                  <Library className="w-3.5 h-3.5" />
                  My Library
                </Link>

                {/* Admin Portal Shortcut if Admin */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#1A1A1A] hover:bg-black rounded border border-stone-800 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#DFC07A]" />
                    Admin Panel
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] bg-white hover:bg-[#F3EFEA] border border-[#E8E1D9] rounded transition-colors shadow-2xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#581C24] text-white flex items-center justify-center text-xs font-serif font-bold">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[100px] truncate font-medium">{user?.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white border border-[#E8E1D9] rounded shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-[#F3EFEA]">
                        <p className="text-xs text-stone-500 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-stone-900 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/account/library"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-[#FAF8F5] hover:text-[#581C24]"
                      >
                        <Library className="w-4 h-4 text-[#C5A059]" />
                        My Library
                      </Link>

                      <Link
                        to="/account/payments"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-[#FAF8F5] hover:text-[#581C24]"
                      >
                        <CreditCard className="w-4 h-4 text-[#C5A059]" />
                        Payment History
                      </Link>

                      <Link
                        to="/account/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-[#FAF8F5] hover:text-[#581C24]"
                      >
                        <User className="w-4 h-4 text-[#C5A059]" />
                        Profile Settings
                      </Link>

                      {isAdmin && (
                        <div className="border-t border-[#F3EFEA] my-1">
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#581C24] font-medium hover:bg-[#FAF8F5]"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-[#F3EFEA] my-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-[#581C24] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#581C24] hover:bg-[#4A121A] rounded shadow-xs transition-all hover:shadow"
                >
                  Join / Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-stone-700 hover:text-[#581C24] rounded-md focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E8E1D9] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded text-base font-medium ${
                  isActive(link.path)
                    ? 'text-[#581C24] bg-[#581C24]/10 font-semibold'
                    : 'text-stone-700 hover:bg-[#FAF8F5]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#E8E1D9] pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-[#FAF8F5] rounded">
                  <p className="text-xs text-stone-500">Signed in as</p>
                  <p className="text-sm font-bold text-stone-900">{user?.name}</p>
                  <p className="text-xs text-stone-600 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/account/library"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-stone-800 hover:bg-[#FAF8F5] rounded"
                >
                  <Library className="w-4 h-4 text-[#581C24]" />
                  My Unlocked Stories
                </Link>

                <Link
                  to="/account/payments"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-stone-800 hover:bg-[#FAF8F5] rounded"
                >
                  <CreditCard className="w-4 h-4 text-[#581C24]" />
                  Payment Submissions
                </Link>

                <Link
                  to="/account/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-stone-800 hover:bg-[#FAF8F5] rounded"
                >
                  <User className="w-4 h-4 text-[#581C24]" />
                  My Profile
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#581C24] bg-[#581C24]/10 rounded"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium text-stone-700 bg-[#F3EFEA] hover:bg-[#E8E1D9] rounded"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-[#581C24] hover:bg-[#4A121A] rounded"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
