import React from 'react';
import { useEmployes } from '@/context/EmployeContext';
import { LogOut, User2, ChevronDown, Building2, UserPlus, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const Header: React.FC = () => {
  const { employes, selectedEmployeId, setSelectedEmployeId, selectedEmploye, loading } = useEmployes();
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 border-b border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between py-3 px-4 md:h-16 md:px-6 max-w-7xl mx-auto">
        {/* Logo et titre */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button is now in Sidebar component */}
          <div className="flex items-center gap-3">
            <div className="relative md:hidden">
              <img
                src="/android-chrome-192x192.png"
                alt="Logo"
                className="w-8 h-8 rounded-lg shadow-sm"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base md:text-xl text-gray-900 truncate leading-tight">
                <span className="md:hidden">EtatDeLux</span>
                <span className="hidden md:inline">État des Lieux</span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
                Gestion simplifiée
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
              onValueChange={(value) => setSelectedEmployeId(value === 'none' ? null : value)}
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {e.prenom} {e.nom}
                            </div>
                            <div className="text-xs text-gray-500">Employé actif</div>
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
    </header>
  );
};