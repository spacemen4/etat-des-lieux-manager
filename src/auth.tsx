import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, Mail, Phone, MapPin, User, Eye, EyeOff, UserCheck, Settings, LogOut, Crown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase, setJwtExpirationHandler, handleJwtExpiration } from './lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Tables, TablesInsert } from '@/types/etatDesLieux';
import { useSupabaseErrorHandler } from './hooks/useSupabaseErrorHandler';

// Types
interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

interface UserProfileFormData {
  prenom: string;
  nom: string;
  date_naissance: string;
  telephone: string;
  adresse_ligne_1: string;
  adresse_ligne_2: string;
  code_postal: string;
  ville: string;
  pays: string;
  profession: string;
  entreprise: string;
  siret: string;
  tva_intra: string;
  type_activite: string;
  carte_professionnelle: string;
  numero_rcp: string;
  bio: string;
  photo_url: string;
  notes_privees: string;
  notifications_email: boolean;
  notifications_sms: boolean;
  langue: string;
  timezone: string;
  signature_url: string;
}

// Contexte d'authentification
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Set up JWT expiration handler
    const handleExpiration = () => {
      console.log('JWT expired, signing out user...');
      setUser(null);
      setError('Votre session a expiré. Veuillez vous reconnecter.');
      supabase.auth.signOut().catch(console.error);
    };
    setJwtExpirationHandler(handleExpiration);

    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (error.message.includes('Auth session missing')) {
            setUser(null);
            setError(null);
          } else if (!handleJwtExpiration(error)) {
            console.error('Auth error:', error);
            setError(error.message);
          }
        } else {
          setUser(user);
          setError(null);
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Auth session missing')) {
          setUser(null);
          setError(null);
        } else if (!handleJwtExpiration(err)) {
          console.error('Auth fetch error:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        setError(null);
      }
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
export const LoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("L'email et le mot de passe sont requis.");
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("Email ou mot de passe incorrect.");
        } else {
          setError(error.message);
        }
        throw error;
      }
      
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
      <CardHeader className="gradient-primary text-white p-6 text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Shield className="w-6 h-6" />
          </div>
          Connexion
        </CardTitle>
        <p className="text-white/80 text-sm mt-2">Accédez à votre espace personnel</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="glass-light backdrop-blur-sm border border-red-200/50 animate-slide-up">
              <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 transition-colors duration-300 micro-bounce"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="remember" className="text-slate-600 cursor-pointer">Se souvenir de moi</Label>
            </div>
            <a href="/forgot-password" className="font-semibold gradient-text hover:opacity-80 transition-opacity duration-300">
              Mot de passe oublié ?
            </a>
          </div>

          <Button 
            type="submit" 
            className="w-full btn-gradient h-12 text-lg font-semibold micro-bounce shadow-xl" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Connexion...
              </div>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
        
        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-500">ou</span>
            </div>
          </div>
          
          <a href="/signup">
            <Button variant="outline" className="w-full glass border-slate-200/50 hover:glass-heavy transition-all duration-300 h-11 micro-bounce">
              <UserPlus className="w-4 h-4 mr-2" />
              Vous n'avez pas de compte ? Inscrivez-vous
            </Button>
          </a>
          
          <a href="https://www.etatdelux.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full glass border-slate-200/50 hover:glass-heavy transition-all duration-300 h-11 micro-bounce">
              <Building className="w-4 h-4 mr-2" />
              Retour au site
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant SignUpForm
export const SignUpForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    prenom: '',
    nom: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { handleError } = useSupabaseErrorHandler();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("L'email est requis");
      return false;
    }
    if (!formData.password) {
      setError("Le mot de passe est requis");
      return false;
    }
    if (!formData.prenom.trim()) {
      setError("Le prénom est requis");
      return false;
    }
    if (!formData.nom.trim()) {
      setError("Le nom est requis");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    console.log('[SignUp] ===== STARTING SIGNUP PROCESS =====');
    console.log('[SignUp] Form data:', {
      email: formData.email.trim(),
      prenom: formData.prenom.trim(),
      nom: formData.nom.trim(),
      password: formData.password ? '[PASSWORD SET]' : '[NO PASSWORD]'
    });

    try {
      // Étape 1: Création du compte auth
      console.log('[SignUp] ===== STEP 1: Creating auth user =====');
      console.log('[SignUp] Calling supabase.auth.signUp with:', {
        email: formData.email.trim(),
        password: '[HIDDEN]',
        options: {
          data: {
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim()
          }
        }
      });

      const authSignUpStart = Date.now();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim()
          }
        }
      });
      const authSignUpDuration = Date.now() - authSignUpStart;

      console.log('[SignUp] Auth signUp completed in', authSignUpDuration, 'ms');
      console.log('[SignUp] Auth response data:', authData ? {
        user: authData.user ? {
          id: authData.user.id,
          email: authData.user.email,
          email_confirmed_at: authData.user.email_confirmed_at,
          user_metadata: authData.user.user_metadata
        } : null,
        session: authData.session ? {
          access_token: '[TOKEN_PRESENT]',
          expires_at: authData.session.expires_at
        } : null
      } : 'NULL_DATA');
      
      if (authError) {
        console.error('[SignUp] ===== AUTH ERROR DETAILS =====');
        console.error('[SignUp] Auth error message:', authError.message);
        console.error('[SignUp] Auth error code:', authError.code || 'NO_CODE');
        console.error('[SignUp] Auth error status:', authError.status || 'NO_STATUS');
        console.error('[SignUp] Full auth error object:', authError);
        throw authError;
      }

      if (!authData.user) {
        console.error('[SignUp] ===== CRITICAL ERROR: No user returned from auth =====');
        console.error('[SignUp] authData was:', authData);
        throw new Error("Erreur lors de la création du compte - aucun utilisateur retourné");
      }

      console.log('[SignUp] ===== AUTH USER SUCCESSFULLY CREATED =====');
      console.log('[SignUp] User ID:', authData.user.id);
      console.log('[SignUp] User email:', authData.user.email);
      console.log('[SignUp] Email confirmed:', !!authData.user.email_confirmed_at);

      // Note: Le profil utilisateur DEVRAIT être créé automatiquement par un trigger de base de données
      console.log('[SignUp] ===== STEP 2: Checking for auto-created user profile =====');
      console.log('[SignUp] Checking if database trigger created the user_profiles record...');
      
      // Attendre un peu pour laisser le trigger s'exécuter
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      
      const profileCheckStart = Date.now();
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('id, user_id, prenom, nom, profil_complet')
        .eq('user_id', authData.user.id)
        .single();
      const profileCheckDuration = Date.now() - profileCheckStart;
      
      console.log('[SignUp] Profile check completed in', profileCheckDuration, 'ms');
      
      if (profileCheckError) {
        console.warn('[SignUp] Profile was not auto-created by trigger:', profileCheckError);
        console.log('[SignUp] ===== FALLBACK: Manual profile creation =====');
        
        // Fallback: Créer le profil manuellement
        try {
          const profileData = {
            user_id: authData.user.id,
            prenom: formData.prenom.trim(),
            nom: formData.nom.trim(),
            profil_complet: false
          };
          console.log('[SignUp] Creating profile manually:', profileData);
          
          const manualProfileStart = Date.now();
          const { data: manualProfileData, error: manualProfileError } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select()
            .single();
          const manualProfileDuration = Date.now() - manualProfileStart;
          
          console.log('[SignUp] Manual profile creation completed in', manualProfileDuration, 'ms');
          
          if (manualProfileError) {
            console.error('[SignUp] Manual profile creation failed:', manualProfileError);
            console.warn('[SignUp] Continuing anyway - profile can be completed later');
          } else {
            console.log('[SignUp] Manual profile creation successful:', manualProfileData);
          }
        } catch (fallbackError) {
          console.error('[SignUp] Exception during manual profile creation:', fallbackError);
          console.warn('[SignUp] Continuing anyway - profile can be completed later');
        }
      } else {
        console.log('[SignUp] Profile successfully auto-created by trigger:', profileCheck);
      }
      
      console.log('[SignUp] ===== SIGNUP PROCESS COMPLETED SUCCESSFULLY =====');
      
      if (!authData.user.email_confirmed_at) {
        console.log('[SignUp] Email confirmation required - setting success message');
        setError("Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.");
      } else {
        console.log('[SignUp] Email already confirmed - calling onSuccess');
        onSuccess?.();
      }

    } catch (error: any) {
      console.error('[SignUp] ===== SIGNUP PROCESS FAILED =====');
      console.error('[SignUp] Error type:', typeof error);
      console.error('[SignUp] Error message:', error.message || 'NO_MESSAGE');
      console.error('[SignUp] Error code:', error.code || 'NO_CODE');
      console.error('[SignUp] Error status:', error.status || 'NO_STATUS');
      console.error('[SignUp] Error details:', error.details || 'NO_DETAILS');
      console.error('[SignUp] Error hint:', error.hint || 'NO_HINT');
      console.error('[SignUp] Full error object:', error);
      console.error('[SignUp] Error stack:', error.stack || 'NO_STACK');
      
      if (error.message.includes('User already registered')) {
        console.log('[SignUp] User already exists - setting appropriate error message');
        setError("Un compte existe déjà avec cet email.");
      } else if (error.message.includes('Database error')) {
        console.log('[SignUp] Database error detected - setting technical error message');
        setError(`
          Problème technique lors de l'inscription. 
          Veuillez contacter le support avec ces informations :
          Email: ${formData.email}
          Prénom: ${formData.prenom}
          Nom: ${formData.nom}
          Erreur: ${error.message}
          Code: ${error.code || 'NON_DÉFINI'}
        `);
      } else if (!handleError(error)) {
        console.log('[SignUp] Generic error - setting fallback error message');
        setError(error.message || "Une erreur inconnue est survenue");
      }
    } finally {
      console.log('[SignUp] ===== SIGNUP PROCESS FINISHED (cleanup) =====');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-heavy backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
      <CardHeader className="gradient-secondary text-white p-6 text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          Inscription
        </CardTitle>
        <p className="text-white/80 text-sm mt-2">Créez votre compte professionnel</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="glass-light backdrop-blur-sm border border-red-200/50 animate-slide-up">
              <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Prénom
              </Label>
              <Input 
                id="prenom" 
                value={formData.prenom} 
                onChange={handleChange}
                required 
                placeholder="Jean"
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-semibold text-slate-700">Nom</Label>
              <Input 
                id="nom" 
                value={formData.nom} 
                onChange={handleChange}
                required 
                placeholder="Dupont"
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange}
              required 
              placeholder="jean.dupont@email.com"
              className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 transition-colors duration-300 micro-bounce"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-gradient h-12 text-lg font-semibold micro-bounce shadow-xl" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Inscription...
              </div>
            ) : (
              'S\'inscrire'
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-500">Déjà inscrit ?</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <a href="/login">
              <Button variant="outline" className="w-full glass border-slate-200/50 hover:glass-heavy transition-all duration-300 h-11 micro-bounce">
                <Shield className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            </a>
            
            {error && error.includes('contacter l\'administrateur') && (
              <a href="mailto:support@etatdelux.com?subject=Inscription%20-%20Problème%20technique&body=Bonjour,%0A%0AJe%20rencontre%20un%20problème%20lors%20de%20l'inscription%20sur%20État%20des%20Lieux%20Manager.%0A%0AMes%20informations%20:%0A%0AEmail%20:%20%0APrénom%20:%20%0ANom%20:%20%0A%0AMerci%20de%20créer%20mon%20compte.%0A%0ACordialement">
                <Button variant="outline" className="w-full glass border-blue-200/50 hover:glass-heavy transition-all duration-300 h-11 micro-bounce">
                  <Mail className="w-4 h-4 mr-2" />
                  Contacter le support
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant UserProfile
export const UserProfile = () => {
  const { user } = useAuth();
  const { handleError } = useSupabaseErrorHandler();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserProfileFormData>({
    prenom: '',
    nom: '',
    date_naissance: '',
    telephone: '',
    adresse_ligne_1: '',
    adresse_ligne_2: '',
    code_postal: '',
    ville: '',
    pays: 'France',
    profession: '',
    entreprise: '',
    siret: '',
    tva_intra: '',
    type_activite: '',
    carte_professionnelle: '',
    numero_rcp: '',
    bio: '',
    photo_url: '',
    notes_privees: '',
    notifications_email: true,
    notifications_sms: false,
    langue: 'fr',
    timezone: 'Europe/Paris',
    signature_url: ''
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          prenom: data.prenom || user.user_metadata?.prenom || '',
          nom: data.nom || user.user_metadata?.nom || '',
          date_naissance: data.date_naissance || '',
          telephone: data.telephone || '',
          adresse_ligne_1: data.adresse_ligne_1 || '',
          adresse_ligne_2: data.adresse_ligne_2 || '',
          code_postal: data.code_postal || '',
          ville: data.ville || '',
          pays: data.pays || 'France',
          profession: data.profession || '',
          entreprise: data.entreprise || '',
          siret: data.siret || '',
          tva_intra: data.tva_intra || '',
          type_activite: data.type_activite || '',
          carte_professionnelle: data.carte_professionnelle || '',
          numero_rcp: data.numero_rcp || '',
          bio: data.bio || '',
          photo_url: data.photo_url || '',
          notes_privees: data.notes_privees || '',
          notifications_email: data.notifications_email ?? true,
          notifications_sms: data.notifications_sms ?? false,
          langue: data.langue || 'fr',
          timezone: data.timezone || 'Europe/Paris',
          signature_url: data.signature_url || ''
        });
      } else {
        setFormData(prev => ({
          ...prev,
          prenom: user.user_metadata?.prenom || '',
          nom: user.user_metadata?.nom || ''
        }));
      }
    } catch (e: any) {
      if (!handleError(e)) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const profileData = {
        user_id: user.id,
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();
        
      if (error) throw error;
      
      setProfile(data);
      setEditing(false);
    } catch (e: any) {
      if (!handleError(e)) {
        setError(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return <div>Chargement...</div>;
  if (loading) return <div>Chargement du profil...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <UserCheck /> Mon Profil
            </CardTitle>
            <Button 
              variant={editing ? "outline" : "default"}
              onClick={() => editing ? setEditing(false) : setEditing(true)}
            >
              {editing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSave} className="space-y-6">
            {/* En-tête du profil */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Photo de profil" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    {editing ? (
                      <Input 
                        id="prenom"
                        value={formData.prenom}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg font-semibold">{formData.prenom || 'Non renseigné'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    {editing ? (
                      <Input 
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg font-semibold">{formData.nom || 'Non renseigné'}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {user.email}
                </p>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  {editing ? (
                    <Input 
                      id="date_naissance"
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                    />
                  ) : (
                    <p>{formData.date_naissance || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  {editing ? (
                    <Input 
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange('telephone', e.target.value)}
                      placeholder="06 12 34 56 78"
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {formData.telephone || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="adresse_ligne_1">Adresse (ligne 1)</Label>
                  {editing ? (
                    <Input 
                      id="adresse_ligne_1"
                      value={formData.adresse_ligne_1}
                      onChange={(e) => handleInputChange('adresse_ligne_1', e.target.value)}
                      placeholder="123 rue de la Paix"
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {formData.adresse_ligne_1 || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="adresse_ligne_2">Adresse (ligne 2)</Label>
                  {editing ? (
                    <Input 
                      id="adresse_ligne_2"
                      value={formData.adresse_ligne_2}
                      onChange={(e) => handleInputChange('adresse_ligne_2', e.target.value)}
                      placeholder="Appartement, étage, etc."
                    />
                  ) : (
                    <p>{formData.adresse_ligne_2 || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="code_postal">Code postal</Label>
                  {editing ? (
                    <Input 
                      id="code_postal"
                      value={formData.code_postal}
                      onChange={(e) => handleInputChange('code_postal', e.target.value)}
                    />
                  ) : (
                    <p>{formData.code_postal || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  {editing ? (
                    <Input 
                      id="ville"
                      value={formData.ville}
                      onChange={(e) => handleInputChange('ville', e.target.value)}
                    />
                  ) : (
                    <p>{formData.ville || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  {editing ? (
                    <Input 
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      placeholder="Agent immobilier"
                    />
                  ) : (
                    <p>{formData.profession || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="entreprise">Entreprise</Label>
                  {editing ? (
                    <Input 
                      id="entreprise"
                      value={formData.entreprise}
                      onChange={(e) => handleInputChange('entreprise', e.target.value)}
                    />
                  ) : (
                    <p>{formData.entreprise || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="type_activite">Type d'activité</Label>
                  {editing ? (
                    <select 
                      id="type_activite"
                      value={formData.type_activite}
                      onChange={(e) => handleInputChange('type_activite', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Sélectionner</option>
                      <option value="particulier">Particulier</option>
                      <option value="agent_immobilier">Agent immobilier</option>
                      <option value="proprietaire">Propriétaire</option>
                      <option value="syndic">Syndic</option>
                      <option value="gestionnaire">Gestionnaire</option>
                      <option value="autre">Autre</option>
                    </select>
                  ) : (
                    <p>{formData.type_activite || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="siret">SIRET</Label>
                  {editing ? (
                    <Input 
                      id="siret"
                      value={formData.siret}
                      onChange={(e) => handleInputChange('siret', e.target.value)}
                      placeholder="12345678901234"
                    />
                  ) : (
                    <p>{formData.siret || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tva_intra">TVA intracommunautaire</Label>
                  {editing ? (
                    <Input 
                      id="tva_intra"
                      value={formData.tva_intra}
                      onChange={(e) => handleInputChange('tva_intra', e.target.value)}
                      placeholder="FR12345678901"
                    />
                  ) : (
                    <p>{formData.tva_intra || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="carte_professionnelle">Carte professionnelle</Label>
                  {editing ? (
                    <Input 
                      id="carte_professionnelle"
                      value={formData.carte_professionnelle}
                      onChange={(e) => handleInputChange('carte_professionnelle', e.target.value)}
                      placeholder="Numéro de carte"
                    />
                  ) : (
                    <p>{formData.carte_professionnelle || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="numero_rcp">Numéro RCP</Label>
                  {editing ? (
                    <Input 
                      id="numero_rcp"
                      value={formData.numero_rcp}
                      onChange={(e) => handleInputChange('numero_rcp', e.target.value)}
                      placeholder="Responsabilité Civile Professionnelle"
                    />
                  ) : (
                    <p>{formData.numero_rcp || 'Non renseigné'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {editing && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bio</h3>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Présentez-vous brièvement..."
                  />
                </div>
              </div>
            )}

            {/* Préférences */}
            {editing && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Préférences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifications_email"
                      checked={formData.notifications_email}
                      onCheckedChange={(checked) => handleInputChange('notifications_email', checked)}
                    />
                    <Label htmlFor="notifications_email">Notifications par email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifications_sms"
                      checked={formData.notifications_sms}
                      onCheckedChange={(checked) => handleInputChange('notifications_sms', checked)}
                    />
                    <Label htmlFor="notifications_sms">Notifications par SMS</Label>
                  </div>
                </div>
              </div>
            )}

            {editing && (
              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="min-w-32">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant TeamManagement
export const TeamManagement = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useSupabaseErrorHandler();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [fonction, setFonction] = useState('');
  const [password, setPassword] = useState('');
  const [actif, setActif] = useState(true);

  const [employes, setEmployes] = useState<Tables<'employes'>[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Load current user id
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingUser(true);
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) throw new Error('Utilisateur non authentifié');
        if (isMounted) {
          setCurrentUserId(user.id);
        }
      } catch (e: any) {
        if (isMounted) {
          if (!handleError(e)) {
            setError(e.message ?? "Erreur d'authentification");
          }
        }
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [handleError]);

  const loadEmployes = useCallback(async (userId: string) => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('employes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmployes(data ?? []);
    } catch (e: any) {
      if (!handleError(e)) {
        setError(e.message ?? 'Erreur lors du chargement des employés');
      }
    } finally {
      setLoadingList(false);
    }
  }, [handleError]);

  // Load employees when currentUserId is known
  useEffect(() => {
    if (currentUserId) {
      loadEmployes(currentUserId);
    }
  }, [currentUserId, loadEmployes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!prenom.trim() || !nom.trim()) {
      setError('Prénom et Nom sont requis');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const newEmploye: TablesInsert<'employes'> = {
        prenom: prenom.trim(),
        nom: nom.trim(),
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        fonction: fonction.trim() || null,
        password: password.trim() || null,
        user_id: user.id,
        actif,
      };

      const { data, error } = await supabase
        .from('employes')
        .insert(newEmploye)
        .select()
        .single();
      if (error) throw error;

      // Reset form and refresh list
      setPrenom('');
      setNom('');
      setEmail('');
      setTelephone('');
      setFonction('');
      setPassword('');
      setActif(true);

      setEmployes((prev) => [data as Tables<'employes'>, ...prev]);
      setIsAddOpen(false);
    } catch (e: any) {
      if (!handleError(e)) {
        setError(e.message ?? "Erreur lors de l'ajout de l'employé");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Gestion de l'équipe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Bouton + Ajouter un employé */}
        <div className="flex justify-end">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                className="min-w-48"
                disabled={loadingUser || !currentUserId}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> + Ajouter un employé
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un employé</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@domaine.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="fonction">Fonction</Label>
                    <Input id="fonction" value={fonction} onChange={(e) => setFonction(e.target.value)} placeholder="Ex: Agent immobilier" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="password">Mot de passe (optionnel)</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Laissez vide si non souhaité"
                    />
                    <p className="text-xs text-gray-500">Le mot de passe peut être ajouté plus tard si nécessaire</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="actif" checked={actif} onCheckedChange={setActif} />
                  <Label htmlFor="actif">Actif</Label>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting || loadingUser} className="min-w-32">
                    {submitting ? "Ajout en cours..." : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Liste des employés */}
        {!loadingUser && currentUserId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Membres</h3>
            {loadingList && <span className="text-sm text-muted-foreground">Chargement...</span>}
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                      {loadingUser || loadingList
                        ? 'Chargement...'
                        : "Aucun employé pour l'instant. Ajoutez votre premier membre."}
                    </TableCell>
                  </TableRow>
                ) : (
                  employes.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.prenom} {emp.nom}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {emp.email && <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {emp.email}</span>}
                          {emp.telephone && <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {emp.telephone}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{emp.fonction ?? '-'}</TableCell>
                      <TableCell>
                        {emp.actif ? (
                          <Badge variant="secondary">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export { AuthContext };