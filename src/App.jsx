import React from 'react';
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
import { Home } from './pages/Home';
import { Stories } from './pages/Stories';
import { StoryDetail } from './pages/StoryDetail';
import { ReaderPage } from './pages/ReaderPage';
import { Categories } from './pages/Categories';
import { CategoryStories } from './pages/CategoryStories';
import { Checkout } from './pages/Checkout';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';

// User Account Pages
import { AccountLibrary } from './pages/account/AccountLibrary';
import { AccountPayments } from './pages/account/AccountPayments';
import { AccountProfile } from './pages/account/AccountProfile';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStories } from './pages/admin/AdminStories';
import { AdminStoryForm } from './pages/admin/AdminStoryForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminPaymentSettings } from './pages/admin/AdminPaymentSettings';

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
    </>
  );
}
