// EquipementsChauffageStep.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEquipementsChauffageByEtatId, useUpdateEquipementsChauffage } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';

interface EquipementsChauffageStepProps {
  etatId: string;
}

const EquipementsChauffageStep: React.FC<EquipementsChauffageStepProps> = ({ etatId }) => {
  const { data: equipementsChauffage, refetch, isLoading } = useEquipementsChauffageByEtatId(etatId);
  const updateEquipementsChauffageMutation = useUpdateEquipementsChauffage();

  const [formData, setFormData] = useState({
    chaudiere_etat: '',
    chaudiere_date_dernier_entretien: '',
    ballon_eau_chaude_etat: '',
  });

  useEffect(() => {
    if (equipementsChauffage) {
      setFormData({
        chaudiere_etat: equipementsChauffage.chaudiere_etat || '',
        chaudiere_date_dernier_entretien: equipementsChauffage.chaudiere_date_dernier_entretien 
          ? new Date(equipementsChauffage.chaudiere_date_dernier_entretien).toISOString().split('T')[0] 
          : '',
        ballon_eau_chaude_etat: equipementsChauffage.ballon_eau_chaude_etat || '',
      });
    }
  }, [equipementsChauffage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Validation basique
      if (!etatId) {
        toast.error('ID de l\'état des lieux manquant');
        return;
      }

      // Préparer les données pour l'envoi
      const dataToSend = {
        etat_des_lieux_id: etatId,
        chaudiere_etat: formData.chaudiere_etat || null,
        chaudiere_date_dernier_entretien: formData.chaudiere_date_dernier_entretien || null,
        ballon_eau_chaude_etat: formData.ballon_eau_chaude_etat || null,
      };

      console.log('Données à envoyer:', dataToSend); // Pour débugger

      await updateEquipementsChauffageMutation.mutateAsync(dataToSend);
      
      toast.success('Équipements de chauffage sauvegardés');
      refetch();
    } catch (error) {
      console.error('Erreur détaillée:', error); // Pour débugger
      
      // Affichage d'erreur plus détaillé
      if (error instanceof Error) {
        toast.error(`Erreur: ${error.message}`);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(`Erreur: ${(error as any).message}`);
      } else {
        toast.error('Erreur lors de la sauvegarde des équipements de chauffage');
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Chargement des équipements de chauffage...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements de chauffage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chaudiere_etat">État de la chaudière</Label>
            <Input
              id="chaudiere_etat"
              value={formData.chaudiere_etat}
              onChange={(e) => handleInputChange('chaudiere_etat', e.target.value)}
              placeholder="Ex: Bon état, Défaillante, À réviser..."
            />
          </div>
          <div>
            <Label htmlFor="chaudiere_date_dernier_entretien">Date du dernier entretien</Label>
            <Input
              id="chaudiere_date_dernier_entretien"
              type="date"
              value={formData.chaudiere_date_dernier_entretien}
              onChange={(e) => handleInputChange('chaudiere_date_dernier_entretien', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ballon_eau_chaude_etat">État du ballon d'eau chaude</Label>
          <Input
            id="ballon_eau_chaude_etat"
            value={formData.ballon_eau_chaude_etat}
            onChange={(e) => handleInputChange('ballon_eau_chaude_etat', e.target.value)}
            placeholder="Ex: Bon état, Défaillant, Fuite détectée..."
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateEquipementsChauffageMutation.isPending}
          className="w-full"
        >
          {updateEquipementsChauffageMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipementsChauffageStep;