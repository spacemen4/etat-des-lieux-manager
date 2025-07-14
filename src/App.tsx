import React from 'react';
import { AuthProvider, useAuth } from './auth';
import { UserProvider } from './context/UserContext';
import { LoginForm, SignUpForm, UserProfile, TeamManagement } from './auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { Toaster } from '@/components/ui/sonner';
import Home from './pages/Home';

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/*" element={<ProtectedRoute><DashboardRoutes /></ProtectedRoute>} />
          </Routes>
        </Router>
        <Toaster position="top-center" />
      </UserProvider>
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
            <Route path="/*" element={<Home />} />
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
