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
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
      <div className={`flex items-center gap-3 ${isMobile ? 'py-2' : 'h-14'} px-3 md:px-6`}>
        <div className="flex items-center gap-3">
          <img src="/android-chrome-192x192.png" alt="Logo" className="w-7 h-7" />
          <span className="font-semibold text-sm md:text-base tracking-tight">État des Lieux Manager</span>
        </div>
        <Separator orientation="vertical" className="mx-3 h-6 hidden md:inline-flex" />
        <div className="ml-auto flex items-center gap-3">
          <User2 className="w-4 h-4 text-muted-foreground" />
          <Select
            value={selectedEmployeId ?? ''}
            onValueChange={(value) => setSelectedEmployeId(value === 'none' ? null : value)}
          >
            <SelectTrigger className="w-[220px] md:w-[280px] h-9 px-3 text-sm font-medium">
              <SelectValue placeholder={loading ? 'Chargement...' : 'Sélectionner un employé (optionnel)'} />
            </SelectTrigger>
            <SelectContent className="min-w-[280px]">
              <SelectGroup>
                <SelectLabel className="font-semibold text-sm px-2 py-1.5">Employé</SelectLabel>
                <SelectItem value="none" className="py-2.5">Aucun (par défaut)</SelectItem>
                {employes.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="py-2.5">
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
