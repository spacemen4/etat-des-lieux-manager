
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEquipementsEnergetiquesByEtatId, useUpdateEquipementsEnergetiques } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';

interface EquipementsEnergetiquesStepProps {
  etatId: string;
}

const EquipementsEnergetiquesStep: React.FC<EquipementsEnergetiquesStepProps> = ({ etatId }) => {
  const { data: equipementsEnergetiques } = useEquipementsEnergetiquesByEtatId(etatId);
  const updateEquipementsEnergetiquesMutation = useUpdateEquipementsEnergetiques();

  const [formData, setFormData] = useState({
    chauffage_type: '',
    eau_chaude_type: '',
  });

  useEffect(() => {
    if (equipementsEnergetiques) {
      setFormData({
        chauffage_type: equipementsEnergetiques.chauffage_type || '',
        eau_chaude_type: equipementsEnergetiques.eau_chaude_type || '',
      });
    }
  }, [equipementsEnergetiques]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateEquipementsEnergetiquesMutation.mutate({
      etat_des_lieux_id: etatId,
      ...formData,
    }, {
      onSuccess: () => {
        toast.success('Équipements énergétiques sauvegardés');
      },
      onError: () => {
        toast.error('Erreur lors de la sauvegarde');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements énergétiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="chauffage_type">Type de chauffage</Label>
          <Input
            id="chauffage_type"
            value={formData.chauffage_type}
            onChange={(e) => handleInputChange('chauffage_type', e.target.value)}
            placeholder="Ex: Électrique, Gaz, Collectif..."
          />
        </div>

        <div>
          <Label htmlFor="eau_chaude_type">Type de production d'eau chaude</Label>
          <Input
            id="eau_chaude_type"
            value={formData.eau_chaude_type}
            onChange={(e) => handleInputChange('eau_chaude_type', e.target.value)}
            placeholder="Ex: Électrique, Gaz, Collectif..."
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateEquipementsEnergetiquesMutation.isPending}
          className="w-full"
        >
          {updateEquipementsEnergetiquesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipementsEnergetiquesStep;
