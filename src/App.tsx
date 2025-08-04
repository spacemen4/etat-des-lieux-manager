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

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthRoutes = () => {
  const { user, loading, error } = useAuth();
  
  console.log("AuthRoutes render - user:", user, "loading:", loading, "error:", error);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-smooth">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h3 className="text-lg font-semibold gradient-text mb-2">État des Lieux Manager</h3>
          <p className="text-muted-foreground">Chargement de l'application...</p>
          {error && <p className="text-red-500 mt-4">Erreur: {error.message}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold gradient-text mb-2">Erreur de chargement</h2>
          <p className="text-red-500 mb-6">{error.message}</p>
          <Button variant="gradient" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="animate-fade-in">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};

const SignUpPage = () => {
  const navigate = useNavigate();
  
  const handleSignUpSuccess = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="animate-slide-up">
        <SignUpForm onSuccess={handleSignUpSuccess} />
      </div>
    </div>
  );
};

export default App;
