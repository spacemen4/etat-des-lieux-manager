import React from 'react';
import { useEmployes } from '@/context/EmployeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { User2 } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export const Header: React.FC = () => {
  const { employes, selectedEmployeId, setSelectedEmployeId, selectedEmploye, loading } = useEmployes();
  const isMobile = useIsMobile();

  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className={`flex items-center gap-3 ${isMobile ? 'py-2' : 'py-3'} px-2 md:px-4`}>
        <div className="flex items-center gap-2">
          <img src="/android-chrome-192x192.png" alt="Logo" className="w-6 h-6" />
          <span className="font-semibold text-sm md:text-base">État des Lieux Manager</span>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6 hidden md:inline-flex" />
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <User2 className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedEmployeId ?? ''}
            onValueChange={(value) => setSelectedEmployeId(value === '' ? null : value)}
          >
            <SelectTrigger className="w-[220px] md:w-[260px]">
              <SelectValue placeholder={loading ? 'Chargement...' : 'Sélectionner un employé (optionnel)'} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Employé</SelectLabel>
                <SelectItem value="">Aucun (par défaut)</SelectItem>
                {employes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.prenom} {e.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
