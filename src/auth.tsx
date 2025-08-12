import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Building, UserPlus, Shield, Mail, Phone, MapPin, Settings, LogOut, Crown, UserCheck, User, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from './lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader as DialogHeaderUI, DialogTitle as DialogTitleUI, DialogTrigger } from '@/components/ui/dialog';
import type { Tables, TablesInsert } from '@/types/etatDesLieux';

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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
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
      
      // La gestion de la session est gérée par Supabase.
      // Le "rememberMe" est implicitement géré par le stockage local.
      // On pourrait ajouter une logique plus fine si nécessaire.

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
                onCheckedChange={setRememberMe}
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
export const SignUpForm = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
                <form onSubmit={handleSignUp} className="space-y-5">
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
                                value={prenom} 
                                onChange={(e) => setPrenom(e.target.value)} 
                                required 
                                placeholder="Jean"
                                className="input-glass border-slate-200/50 focus:border-blue-400/50 transition-all duration-300 h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nom" className="text-sm font-semibold text-slate-700">Nom</Label>
                            <Input 
                                id="nom" 
                                value={nom} 
                                onChange={(e) => setNom(e.target.value)} 
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
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                    
                    <div className="mt-4">
                        <a href="/login">
                            <Button variant="outline" className="w-full glass border-slate-200/50 hover:glass-heavy transition-all duration-300 h-11 micro-bounce">
                                <Shield className="w-4 h-4 mr-2" />
                                Se connecter
                            </Button>
                        </a>
                    </div>
                </div>
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
  // Scope by current user's id (table `employes.user_id`)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loadingUser, setLoadingUser] = React.useState<boolean>(true);
  const [loadingList, setLoadingList] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [prenom, setPrenom] = React.useState('');
  const [nom, setNom] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telephone, setTelephone] = React.useState('');
  const [fonction, setFonction] = React.useState('');
  const [actif, setActif] = React.useState(true);

  const [employes, setEmployes] = React.useState<Tables<'employes'>[]>([]);

  // Dialog state for creating a new employee
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  // Plus de dépendance à la table `utilisateurs` depuis que `employes.user_id`
  // référence `auth.users.id` directement.

  // Load current user id
  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingUser(true);
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) throw new Error('Utilisateur non authentifié');
        if (isMounted) {
          setCurrentUserId(user.id);
          console.log('[TeamManagement] Loaded auth user', { userId: user.id });
        }
      } catch (e: any) {
        if (isMounted) setError(e.message ?? "Erreur d'authentification");
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const loadEmployes = React.useCallback(async (userId: string) => {
    setLoadingList(true);
    console.log('[TeamManagement] loadEmployes: start', { userId });
    try {
      const { data, error } = await supabase
        .from('employes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmployes(data ?? []);
      console.log('[TeamManagement] loadEmployes: success', { count: data?.length ?? 0 });
    } catch (e: any) {
      setError(e.message ?? 'Erreur lors du chargement des employés');
      console.error('[TeamManagement] loadEmployes: error', e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Load employees when currentUserId is known
  React.useEffect(() => {
    if (currentUserId) {
      console.log('[TeamManagement] currentUserId ready, loading employees');
      loadEmployes(currentUserId);
    }
  }, [currentUserId, loadEmployes]);

  // Trace key state changes
  React.useEffect(() => {
    console.log('[TeamManagement] state changed', {
      currentUserId,
      loadingUser,
      loadingList,
      submitting,
      isAddOpen,
    });
  }, [currentUserId, loadingUser, loadingList, submitting, isAddOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!prenom.trim() || !nom.trim()) {
      setError('Prénom et Nom sont requis');
      return;
    }

    setSubmitting(true);
    try {
      console.log('[TeamManagement] handleSubmit: start', { prenom, nom, email, telephone, fonction, actif });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('[TeamManagement] handleSubmit: current auth user', { userId: user?.id });
      if (!user) throw new Error('Utilisateur non authentifié');
      // Plus besoin de vérifier la présence dans `utilisateurs`

      const newEmploye: TablesInsert<'employes'> = {
        prenom: prenom.trim(),
        nom: nom.trim(),
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        fonction: fonction.trim() || null,
        user_id: user.id,
        actif,
      };
      console.log('[TeamManagement] handleSubmit: inserting employe', newEmploye);

      const { data, error } = await supabase
        .from('employes')
        .insert(newEmploye)
        .select()
        .single();
      if (error) throw error;
      console.log('[TeamManagement] handleSubmit: insert success', { created: data });

      // Reset form and refresh list
      setPrenom('');
      setNom('');
      setEmail('');
      setTelephone('');
      setFonction('');
      setActif(true);

      setEmployes((prev) => [data as Tables<'employes'>, ...prev]);
      // Close dialog after successful creation
      console.log('[TeamManagement] handleSubmit: closing dialog');
      setIsAddOpen(false);
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'ajout de l'employé");
      console.error('[TeamManagement] handleSubmit: error', e);
    } finally {
      setSubmitting(false);
      console.log('[TeamManagement] handleSubmit: end');
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
          <Dialog open={isAddOpen} onOpenChange={async (open) => { 
              console.log('[TeamManagement] Dialog onOpenChange', { open }); 
              setIsAddOpen(open); 
            }}>
            <DialogTrigger asChild>
              <Button
                className="min-w-48"
                disabled={loadingUser || !currentUserId}
                onClick={() => { console.log('[TeamManagement] Add employee button clicked'); }}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> + Ajouter un employé
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeaderUI>
                <DialogTitleUI>Ajouter un employé</DialogTitleUI>
              </DialogHeaderUI>

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

export {
  AuthContext,
};
