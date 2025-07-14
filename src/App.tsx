import React from 'react';
import { AuthProvider, useAuth } from './auth';
import { UserProvider } from './context/UserContext';
import { LoginForm, SignUpForm, UserProfile, TeamManagement } from './auth';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { Toaster } from '@/components/ui/sonner';
// Import des pages
import Index from './pages/Index';
import NewEtatDesLieux from './pages/NewEtatDesLieux';
import EtatSortie from './pages/EtatSortie';
import MonCalendrierPage from './pages/MonCalendrier';

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
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
        <>
          <Route path="/" element={<DashboardLayout><Outlet /></DashboardLayout>}>
            <Route index element={<Index />} />
            <Route path="new-etat-des-lieux" element={<NewEtatDesLieux />} />
            <Route path="sortie/:id" element={<EtatSortie />} />
            <Route path="mon-calendrier" element={<MonCalendrierPage />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="team" element={<TeamManagement />} />
          </Route>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  
  const handleLoginSuccess = () => {
    // La navigation sera gérée automatiquement par le changement d'état d'authentification
    // Mais on peut forcer une redirection au cas où
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
};

const SignUpPage = () => {
  const navigate = useNavigate();
  
  const handleSignUpSuccess = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SignUpForm onSuccess={handleSignUpSuccess} />
    </div>
  );
};

export default App;
