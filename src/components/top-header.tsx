import React from 'react';
import { useEmployes } from '@/context/EmployeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { LogOut, User2, ChevronDown, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Header: React.FC = () => {
  const { employes, selectedEmployeId, setSelectedEmployeId, selectedEmploye, loading } = useEmployes();
  const isMobile = useIsMobile();
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 border-b border-gray-200/80 shadow-sm">
      <div className={`flex items-center justify-between ${isMobile ? 'py-3 px-4' : 'h-16 px-6'} max-w-7xl mx-auto`}>
        {/* Logo et titre */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <img 
              src="/android-chrome-192x192.png" 
              alt="Logo" 
              className="w-8 h-8 rounded-lg shadow-sm ring-1 ring-gray-200/50" 
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg md:text-xl text-gray-900 truncate leading-none">
              État des Lieux Manager
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
              Gestion simplifiée de vos états des lieux
            </p>
          </div>
        </div>

        {/* Section utilisateur */}
        <div className="flex items-center gap-3">
          {/* Sélecteur d'employé avec design amélioré */}
          <div className="relative">
            <Select
              value={selectedEmployeId ?? ''}
              onValueChange={(value) => setSelectedEmployeId(value === 'none' ? null : value)}
            >
              <SelectTrigger className="w-[180px] md:w-[240px] h-10 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-left">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <User2 className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
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
                        <div className="text-xs text-gray-500 hidden md:block">Employé sélectionné</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-600">Aucun employé</div>
                        <div className="text-xs text-gray-400 hidden md:block">Cliquer pour sélectionner</div>
                      </div>
                    )}
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="w-[280px] border border-gray-200 shadow-xl rounded-lg bg-white/95 backdrop-blur-sm">
                <SelectGroup>
                  <SelectLabel className="font-semibold text-sm px-4 py-3 text-gray-700 bg-gray-50/80 border-b border-gray-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      Choisir un employé
                    </div>
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

          {/* Séparateur avec design amélioré */}
          <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

          {/* Bouton déconnexion avec design amélioré */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="group gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 border border-gray-200 hover:border-red-200 px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            <span className="hidden md:inline font-medium">Se déconnecter</span>
          </Button>
        </div>
      </div>

      {/* Employé sélectionné - Badge mobile amélioré */}
      {selectedEmploye && isMobile && (
        <div className="px-4 pb-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full px-4 py-2 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <User2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-800">
              {selectedEmploye.prenom} {selectedEmploye.nom}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};