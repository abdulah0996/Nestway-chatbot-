import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import WhatsAppPlatformPage from './pages/whatsapp/WhatsAppPlatformPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import CounselorDashboardPage from './pages/counselor/CounselorDashboardPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ErrorBoundary from './components/common/ErrorBoundary';

// Protected Route Guard with strict role validation
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EFEAE2] text-[#111111] text-xs font-bold font-sans">
        Authenticating Workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Unauthorized access: strictly redirect user to their designated role dashboard
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'COUNSELOR') {
      return <Navigate to="/admin/inbox" replace />;
    } else if (user.role === 'STUDENT') {
      return <Navigate to="/student/chat" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <ErrorBoundary title="Application Error">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public WhatsApp AI Chat Demo */}
            <Route path="/" element={<WhatsAppPlatformPage />} />
            <Route path="/chat" element={<WhatsAppPlatformPage />} />
            <Route path="/whatsapp" element={<WhatsAppPlatformPage />} />
            <Route path="/crm" element={<WhatsAppPlatformPage />} />

            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Direct New Appointment aliases */}
            <Route path="/appointments/new" element={<Navigate to="/admin/appointments/new" replace />} />
            <Route path="/new-appointment" element={<Navigate to="/admin/appointments/new" replace />} />

            {/* ADMIN & COUNSELOR WORKSPACE: Unified in Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Dedicated New Appointment Routes */}
            <Route
              path="/admin/appointments/new"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments/create"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/new-appointment"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Multi-segment tab routes e.g. /admin/appointments/new, /admin/:tab/:subtab */}
            <Route
              path="/admin/:tab/:subtab"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/:tab"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* COUNSELOR LEGACY ROUTES: Redirect directly to Unified Admin Inbox */}
            <Route
              path="/counselor"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <Navigate to="/admin/inbox" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counselor/:tab"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'COUNSELOR']}>
                  <Navigate to="/admin/inbox" replace />
                </ProtectedRoute>
              }
            />

            {/* STUDENT: /student/chat */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <Navigate to="/student/chat" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:tab"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

