import React from 'react';
import { AuthProvider, useAuth } from './auth';
import { LoginForm, SignUpForm, UserProfile, TeamManagement } from './auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { Toaster } from '@/components/ui/sonner';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/*" element={<ProtectedRoute><DashboardRoutes /></ProtectedRoute>} />
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </AuthProvider>
  );
};

const LoginPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <LoginForm onSuccess={() => window.location.href = '/'} />
  </div>
);

const SignUpPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <SignUpForm onSuccess={() => window.location.href = '/login'} />
  </div>
);

const DashboardRoutes = () => (
    <DashboardLayout>
        <Routes>
            <Route path="profile" element={<UserProfile />} />
            <Route path="team" element={<TeamManagement />} />
            {/* Redirection de la racine du tableau de bord vers le profil */}
            <Route path="/" element={<Navigate to="profile" replace />} />
        </Routes>
    </DashboardLayout>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>; // Ou un spinner de chargement
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default App;
