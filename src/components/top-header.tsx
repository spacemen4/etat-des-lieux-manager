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
          <img src="/android-chrome-192x192.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
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
        <div className="flex items-center gap-2 md:gap-4">
          {/* Sélecteur d'employé */}
          <div className="flex items-center gap-2 bg-gray-50/80 rounded-lg px-3 py-2 border border-gray-200/60">
            <User2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <Select
              value={selectedEmployeId ?? ''}
              onValueChange={(value) => setSelectedEmployeId(value === 'none' ? null : value)}
            >
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto w-[180px] md:w-[220px] text-sm font-medium text-gray-700 focus:ring-0 hover:text-gray-900 transition-colors">
                <SelectValue 
                  placeholder={loading ? 'Chargement...' : 'Sélectionner un employé'} 
                  className="truncate"
                />
                <ChevronDown className="w-3 h-3 ml-2 text-gray-400" />
              </SelectTrigger>
              <SelectContent className="min-w-[280px] border border-gray-200 shadow-xl">
                <SelectGroup>
                  <SelectLabel className="font-semibold text-sm px-3 py-2 text-gray-700 bg-gray-50/50">
                    Choisir un employé
                  </SelectLabel>
                  <Separator className="my-1" />
                  <SelectItem 
                    value="none" 
                    className="py-3 px-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      Aucun employé sélectionné
                    </div>
                  </SelectItem>
                  {employes.map((e) => (
                    <SelectItem 
                      key={e.id} 
                      value={e.id} 
                      className="py-3 px-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{e.prenom} {e.nom}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Séparateur */}
          <Separator orientation="vertical" className="h-8 bg-gray-300 hidden md:block" />

          {/* Bouton déconnexion */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-red-50 hover:border-red-200 transition-all duration-200 border border-transparent px-3 py-2 rounded-lg"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline font-medium">Se déconnecter</span>
          </Button>
        </div>
      </div>

      {/* Employé sélectionné - Badge mobile */}
      {selectedEmploye && isMobile && (
        <div className="px-4 pb-3">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-blue-700">
              {selectedEmploye.prenom} {selectedEmploye.nom}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};