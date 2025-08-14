import React, { useState } from 'react';
import { useEmployes } from '@/context/EmployeContext';
import { LogOut, User2, ChevronDown, Building2, UserPlus, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const Header: React.FC = () => {
  const { employes, selectedEmployeId, setSelectedEmployeId, selectedEmploye, loading } = useEmployes();
  const navigate = useNavigate();
  
  // Password verification states
  const [passwordDialog, setPasswordDialog] = useState({ open: false, employeeId: '', employeeName: '' });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
      console.error('Erreur de déconnexion:', error);
    }
  };

  const handleEmployeeSelect = (value: string) => {
    if (value === 'none') {
      setSelectedEmployeId(null);
      return;
    }

    const employee = employes.find(e => e.id === value);
    if (!employee) return;

    // If employee has a password, show password dialog
    if (employee.password) {
      setPasswordDialog({
        open: true,
        employeeId: value,
        employeeName: `${employee.prenom} ${employee.nom}`
      });
      setPasswordInput('');
      setShowPassword(false);
    } else {
      // No password required, select directly
      setSelectedEmployeId(value);
    }
  };

  const verifyPassword = async () => {
    if (!passwordInput.trim()) {
      toast.error('Veuillez saisir le mot de passe');
      return;
    }

    setVerifying(true);
    try {
      const employee = employes.find(e => e.id === passwordDialog.employeeId);
      if (!employee) {
        toast.error('Employé introuvable');
        return;
      }

      // Simple password comparison (in production, you should hash passwords)
      if (passwordInput.trim() === employee.password) {
        setSelectedEmployeId(passwordDialog.employeeId);
        setPasswordDialog({ open: false, employeeId: '', employeeName: '' });
        setPasswordInput('');
        toast.success(`Connexion réussie en tant que ${passwordDialog.employeeName}`);
      } else {
        toast.error('Mot de passe incorrect');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification');
      console.error('Password verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const closePasswordDialog = () => {
    setPasswordDialog({ open: false, employeeId: '', employeeName: '' });
    setPasswordInput('');
    setShowPassword(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 border-b border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between py-3 px-4 md:h-16 md:px-6 max-w-7xl mx-auto">
        {/* Logo et titre */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button is now in Sidebar component */}
          <div className="flex items-center gap-3">
            {/* Logo mobile */}
            <div className="relative md:hidden ml-12">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="Logo"
                    className="w-7 h-7 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            {/* Logo desktop */}
            <div className="relative hidden md:block">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="Logo EtatDeLux"
                    className="w-8 h-8 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="min-w-0">
              <h1 className="font-bold text-lg md:text-2xl gradient-text truncate leading-tight tracking-tight">
                <span className="md:hidden">EtatDeLux</span>
                <span className="hidden md:inline">EtatDeLux</span>
              </h1>
              <p className="text-xs text-slate-600/80 mt-0.5 hidden md:block font-medium">
                L'état des lieux dématérialisé et simplifié
              </p>
            </div>
          </div>
        </div>

        {/* Section utilisateur */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Sélecteur d'employé avec design amélioré */}
          <div className="relative">
            <Select
              value={selectedEmployeId ?? ''}
              onValueChange={handleEmployeeSelect}
            >
              <SelectTrigger className="w-auto md:w-[240px] h-10 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg shadow-sm px-2 md:px-3">
                <div className="flex items-center gap-2 text-left">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <User2 className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 hidden md:block">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-500">Chargement...</span>
                      </div>
                    ) : selectedEmploye ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {selectedEmploye.prenom} {selectedEmploye.nom}
                        </div>
                        <div className="text-xs text-gray-500">Employé sélectionné</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Aucun employé</div>
                        <div className="text-xs text-gray-400">Sélectionner</div>
                      </div>
                    )}
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="w-[280px] border-gray-200 shadow-xl rounded-lg bg-white/95 backdrop-blur-sm">
                <SelectGroup>
                  <SelectLabel className="font-semibold text-sm px-4 py-3 text-gray-700 bg-gray-50/80 border-b border-gray-100 rounded-t-lg flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    Choisir un employé
                  </SelectLabel>
                  <div className="p-1">
                    <SelectItem 
                      value="none" 
                      className="py-3 px-3 m-1 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-gray-600 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User2 className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Aucun employé</div>
                          <div className="text-xs text-gray-500">Mode sans sélection</div>
                        </div>
                      </div>
                    </SelectItem>
                    
                    {/* Lien vers la page Team si aucun employé */}
                    {employes.length === 0 && (
                      <div className="m-1 px-3 py-2">
                        <Link
                          to="/team"
                          className="flex items-center gap-3 p-3 rounded-md transition-all duration-300 hover:bg-blue-50 border border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <UserPlus className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-blue-700">Créer votre premier employé</div>
                            <div className="text-xs text-blue-500">Gérez votre équipe</div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-blue-500" />
                        </Link>
                      </div>
                    )}
                    
                    {employes.map((e) => (
                      <SelectItem 
                        key={e.id} 
                        value={e.id} 
                        className="py-3 px-3 m-1 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <User2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {e.prenom} {e.nom}
                              {e.password && (
                                <Lock className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {e.password ? 'Employé protégé' : 'Employé actif'}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-8 bg-gray-200/80"></div>

          {/* Bouton déconnexion */}
          <Button 
            variant="ghost" 
            size="icon"
            className="group text-gray-600 hover:text-red-600 hover:bg-red-50/80 transition-colors duration-200 rounded-full w-10 h-10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span className="sr-only">Se déconnecter</span>
          </Button>
        </div>
      </div>

      {/* Employé sélectionné - Badge mobile amélioré */}
      {selectedEmploye && (
        <div className="md:hidden px-4 pb-3 -mt-1">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 rounded-full px-3 py-1.5 text-blue-800">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-inner">
              <User2 className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-medium">
              {selectedEmploye.prenom} {selectedEmploye.nom}
            </span>
          </div>
        </div>
      )}

      {/* Password Verification Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={() => closePasswordDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Authentification requise
            </DialogTitle>
            <DialogDescription>
              L'employé <strong>{passwordDialog.employeeName}</strong> nécessite un mot de passe pour être sélectionné.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="employee-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Saisissez le mot de passe"
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      verifyPassword();
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={closePasswordDialog}
                disabled={verifying}
              >
                Annuler
              </Button>
              <Button 
                onClick={verifyPassword}
                disabled={verifying || !passwordInput.trim()}
                className="min-w-24"
              >
                {verifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Vérification...
                  </div>
                ) : (
                  'Confirmer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};