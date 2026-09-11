import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AccountLayout } from './layouts/AccountLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Guards
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Customer Pages
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Stories = lazy(() => import('./pages/Stories').then((module) => ({ default: module.Stories })));
const StoryDetail = lazy(() => import('./pages/StoryDetail').then((module) => ({ default: module.StoryDetail })));
const ReaderPage = lazy(() => import('./pages/ReaderPage').then((module) => ({ default: module.ReaderPage })));
const Categories = lazy(() => import('./pages/Categories').then((module) => ({ default: module.Categories })));
const CategoryStories = lazy(() => import('./pages/CategoryStories').then((module) => ({ default: module.CategoryStories })));
const Checkout = lazy(() => import('./pages/Checkout').then((module) => ({ default: module.Checkout })));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess').then((module) => ({ default: module.PaymentSuccess })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((module) => ({ default: module.ForgotPassword })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

// User Account Pages
const AccountLibrary = lazy(() => import('./pages/account/AccountLibrary').then((module) => ({ default: module.AccountLibrary })));
const AccountPayments = lazy(() => import('./pages/account/AccountPayments').then((module) => ({ default: module.AccountPayments })));
const AccountProfile = lazy(() => import('./pages/account/AccountProfile').then((module) => ({ default: module.AccountProfile })));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminStories = lazy(() => import('./pages/admin/AdminStories').then((module) => ({ default: module.AdminStories })));
const AdminStoryForm = lazy(() => import('./pages/admin/AdminStoryForm').then((module) => ({ default: module.AdminStoryForm })));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then((module) => ({ default: module.AdminCategories })));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments').then((module) => ({ default: module.AdminPayments })));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers').then((module) => ({ default: module.AdminUsers })));
const AdminPaymentSettings = lazy(() => import('./pages/admin/AdminPaymentSettings').then((module) => ({ default: module.AdminPaymentSettings })));

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            border: '1px solid #E8E1D9',
            background: '#FAF8F5',
            color: '#1A1A1A',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          },
          success: {
            iconTheme: {
              primary: '#581C24',
              secondary: '#FAF8F5'
            }
          }
        }}
      />

      <Suspense fallback={<div role="status" className="min-h-[60vh] flex items-center justify-center text-[#581C24] font-serif">Loading QissaGhar...</div>}>
      <Routes>
        {/* Fullscreen PDF Reader (No main navbar/footer for distraction-free reading) */}
        <Route path="/story/:slug/read" element={<ReaderPage />} />

        {/* Customer-Facing Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/story/:slug" element={<StoryDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:slug" element={<CategoryStories />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Checkout & Payment Protected Flow */}
          <Route
            path="/checkout/:storyId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* User Account Portal */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/account/library" replace />} />
            <Route path="library" element={<AccountLibrary />} />
            <Route path="payments" element={<AccountPayments />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Portal Protected Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="stories/new" element={<AdminStoryForm />} />
          <Route path="stories/:id/edit" element={<AdminStoryForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="payment-settings" element={<AdminPaymentSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </>
  );
}
