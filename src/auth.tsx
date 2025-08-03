import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Building, UserPlus, Shield, Mail, Phone, MapPin, Settings, LogOut, Crown, UserCheck, User } from 'lucide-react';
import { supabase } from './lib/supabase';

// Contexte d'authentification
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    signOut: async () => {
      try {
        setLoading(true);
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      } finally {
        setLoading(false);
      }
    },
  };

  console.log("AuthProvider render - state:", { user, loading, error });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Composant LoginForm
export const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Attendre un peu pour laisser le temps à l'état d'authentification de se mettre à jour
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <p>Vous n'avez pas de compte ? <a href="/signup" className="underline">Inscrivez-vous</a></p>
        </div>
        <div className="mt-4 text-center">
            <a href="https://www.etatdelux.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                    Retour au site
                </Button>
            </a>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant SignUpForm
export const SignUpForm = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const { data: { user }, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        prenom,
                        nom
                    }
                }
            });
            if (error) throw error;
            
            onSuccess?.();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Inscription</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    <div className="space-y-1">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="nom">Nom</Label>
                        <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

// Composant UserProfile
export const UserProfile = () => {
  const { user } = useAuth();

  if (!user) return <div>Chargement...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck /> Mon Profil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.user_metadata.prenom} {user.user_metadata.nom}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {user.email}</div>
          <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {user.phone || 'Non renseigné'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Placeholder for TeamManagement component
export const TeamManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion de l'équipe</CardTitle>
      </CardHeader>
      <CardContent>
        <p>La fonctionnalité de gestion de l'équipe est en cours de développement.</p>
      </CardContent>
    </Card>
  );
};

export {
  AuthContext,
};
