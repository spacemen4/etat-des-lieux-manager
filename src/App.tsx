import React from 'react';
import { AuthProvider, useAuth } from './auth';
import { UserProvider } from './context/UserContext';
import { LoginForm, SignUpForm, UserProfile, TeamManagement } from './auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { Toaster } from '@/components/ui/sonner';
import Home from './pages/Home';

const App = () => {
  console.log("App component rendering");
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

const DashboardRoutes = () => {
    console.log("DashboardRoutes component rendering");
    return (
        <DashboardLayout>
            <Routes>
                <Route path="profile" element={<UserProfile />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="/*" element={<Home />} />
            </Routes>
        </DashboardLayout>
    );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default App;
