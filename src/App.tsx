import React from 'react';
import { AuthProvider, useAuth } from './auth';
import { UserProvider } from './context/UserContext';
import { EmployeProvider } from './context/EmployeContext';
import { LoginForm, SignUpForm, UserProfile, TeamManagement } from './auth';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { Toaster } from '@/components/ui/sonner';
// Import des pages
import Index from './pages/Index';
import NewEtatDesLieux from './pages/NewEtatDesLieux';
import EtatSortie from './pages/EtatSortie';
import MonCalendrierPage from './pages/MonCalendrier';
import UpdatePasswordPage from './pages/UpdatePassword';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from './lib/supabase';

const AuthRoutes = () => {
  const { user, loading, error } = useAuth();
  
  console.log("AuthRoutes render - user:", user, "loading:", loading, "error:", error);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-heavy p-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-neon rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-smooth animate-glow">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-white"></div>
          </div>
          <h3 className="text-xl font-bold gradient-text mb-3 animate-pulse-soft">État des Lieux Manager</h3>
          <p className="text-muted-foreground/80 backdrop-blur-sm">Chargement de l'application...</p>
          {error && <p className="text-red-500 mt-4 animate-fade-in">Erreur: {error.message}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-heavy p-10 text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-soft">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold gradient-text mb-3 animate-glow">Erreur de chargement</h2>
          <p className="text-red-500/80 mb-8 backdrop-blur-sm">{error.message}</p>
          <Button variant="gradient-aurora" className="micro-bounce" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      {!user ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<EmployeProvider><DashboardLayout><Outlet /></DashboardLayout></EmployeProvider>}>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-shimmer"></div>
      <div className="animate-slide-up z-10 w-full max-w-md mx-auto">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);
    if (error) {
      setError("Erreur lors de la réinitialisation du mot de passe. Veuillez vérifier l'email et réessayer.");
    } else {
      setSuccess("Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert variant="default"><AlertDescription>{success}</AlertDescription></Alert>}

            <p className="text-sm text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation de mot de passe.
            </p>

            {!success && (
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            {!success && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
              Retour à la connexion
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const SignUpPage = () => {
  const navigate = useNavigate();
  
  const handleSignUpSuccess = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 md:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-shimmer" style={{animationDelay: '1s'}}></div>
      <div className="animate-slide-in-left z-10 w-full max-w-md mx-auto">
        <SignUpForm onSuccess={handleSignUpSuccess} />
      </div>
    </div>
  );
};

export default App;
