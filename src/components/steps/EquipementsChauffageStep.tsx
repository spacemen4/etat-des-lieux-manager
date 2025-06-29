
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
  const { data: equipementsChauffage } = useEquipementsChauffageByEtatId(etatId);
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
        chaudiere_date_dernier_entretien: equipementsChauffage.chaudiere_date_dernier_entretien || '',
        ballon_eau_chaude_etat: equipementsChauffage.ballon_eau_chaude_etat || '',
      });
    }
  }, [equipementsChauffage]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateEquipementsChauffageMutation.mutate({
      etat_des_lieux_id: etatId,
      ...formData,
    }, {
      onSuccess: () => {
        toast.success('Équipements de chauffage sauvegardés');
      },
      onError: () => {
        toast.error('Erreur lors de la sauvegarde');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements de chauffage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="chaudiere_etat">État de la chaudière</Label>
          <Input
            id="chaudiere_etat"
            value={formData.chaudiere_etat}
            onChange={(e) => handleInputChange('chaudiere_etat', e.target.value)}
            placeholder="Ex: Bon état, Défaillante..."
          />
        </div>

        <div>
          <Label htmlFor="chaudiere_date_dernier_entretien">Date du dernier entretien de la chaudière</Label>
          <Input
            id="chaudiere_date_dernier_entretien"
            type="date"
            value={formData.chaudiere_date_dernier_entretien}
            onChange={(e) => handleInputChange('chaudiere_date_dernier_entretien', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="ballon_eau_chaude_etat">État du ballon d'eau chaude</Label>
          <Input
            id="ballon_eau_chaude_etat"
            value={formData.ballon_eau_chaude_etat}
            onChange={(e) => handleInputChange('ballon_eau_chaude_etat', e.target.value)}
            placeholder="Ex: Bon état, Défaillant..."
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
