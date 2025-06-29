
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useReleveCompteursByEtatId, useUpdateReleveCompteurs } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';

interface ReleveCompteursStepProps {
  etatId: string;
}

const ReleveCompteursStep: React.FC<ReleveCompteursStepProps> = ({ etatId }) => {
  const { data: releveCompteurs, isLoading } = useReleveCompteursByEtatId(etatId);
  const updateReleveCompteursMutation = useUpdateReleveCompteurs();

  const [formData, setFormData] = useState({
    electricite_h_pleines: '',
    electricite_h_creuses: '',
    gaz_naturel_releve: '',
    eau_chaude_m3: '',
    eau_froide_m3: '',
  });

  useEffect(() => {
    if (releveCompteurs) {
      const newFormData = {
        electricite_h_pleines: releveCompteurs.electricite_h_pleines || '',
        electricite_h_creuses: releveCompteurs.electricite_h_creuses || '',
        gaz_naturel_releve: releveCompteurs.gaz_naturel_releve || '',
        eau_chaude_m3: releveCompteurs.eau_chaude_m3 || '',
        eau_froide_m3: releveCompteurs.eau_froide_m3 || '',
      };
      setFormData(newFormData);
    }
  }, [releveCompteurs]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateReleveCompteursMutation.mutate({
      etat_des_lieux_id: etatId,
      ...formData,
    }, {
      onSuccess: () => {
        toast.success('Relevé des compteurs sauvegardé');
      },
      onError: () => {
        toast.error('Erreur lors de la sauvegarde');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relevé des compteurs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="electricite_h_pleines">Électricité - Heures pleines</Label>
            <Input
              id="electricite_h_pleines"
              type="number"
              value={formData.electricite_h_pleines}
              onChange={(e) => handleInputChange('electricite_h_pleines', e.target.value)}
              placeholder="Index en kWh"
            />
          </div>
          <div>
            <Label htmlFor="electricite_h_creuses">Électricité - Heures creuses</Label>
            <Input
              id="electricite_h_creuses"
              type="number"
              value={formData.electricite_h_creuses}
              onChange={(e) => handleInputChange('electricite_h_creuses', e.target.value)}
              placeholder="Index en kWh"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="gaz_naturel_releve">Gaz naturel</Label>
          <Input
            id="gaz_naturel_releve"
            type="number"
            value={formData.gaz_naturel_releve}
            onChange={(e) => handleInputChange('gaz_naturel_releve', e.target.value)}
            placeholder="Index en m³"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="eau_chaude_m3">Eau chaude (m³)</Label>
            <Input
              id="eau_chaude_m3"
              type="number"
              value={formData.eau_chaude_m3}
              onChange={(e) => handleInputChange('eau_chaude_m3', e.target.value)}
              placeholder="Index en m³"
            />
          </div>
          <div>
            <Label htmlFor="eau_froide_m3">Eau froide (m³)</Label>
            <Input
              id="eau_froide_m3"
              type="number"
              value={formData.eau_froide_m3}
              onChange={(e) => handleInputChange('eau_froide_m3', e.target.value)}
              placeholder="Index en m³"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateReleveCompteursMutation.isPending}>
          {updateReleveCompteursMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReleveCompteursStep;
