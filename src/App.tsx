import React from 'react';
import { AuthProvider, useAuth } from './auth';
import { UserProvider } from './context/UserContext';
import { LoginForm, SignUpForm, UserProfile, TeamManagement } from './auth';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { Toaster } from '@/components/ui/sonner';
import Home from './pages/Home';

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <AuthRoutes />
        </Router>
        <Toaster position="top-center" />
      </UserProvider>
    </AuthProvider>
  );
};

const AuthRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <Route path="/" element={<DashboardLayout><Outlet /></DashboardLayout>}>
          <Route index element={<Home />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
};

const LoginPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <LoginForm onSuccess={() => {}} />
  </div>
);

const SignUpPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <SignUpForm onSuccess={() => (window.location.href = '/login')} />
  </div>
);

export default App;
