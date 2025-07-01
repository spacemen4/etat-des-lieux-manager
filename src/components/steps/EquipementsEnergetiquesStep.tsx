
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useEquipementsEnergetiquesByEtatId, useUpdateEquipementsEnergetiques } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';

interface EquipementsEnergetiquesStepProps {
  etatId: string;
}

const EquipementsEnergetiquesStep: React.FC<EquipementsEnergetiquesStepProps> = ({ etatId }) => {
  const { data: equipementsEnergetiques, refetch, isLoading, error } = useEquipementsEnergetiquesByEtatId(etatId);
  const updateEquipementsEnergetiquesMutation = useUpdateEquipementsEnergetiques();

  const [formData, setFormData] = useState({
    chauffage_type: '',
    eau_chaude_type: '',
    dpe_classe: '',
    ges_classe: '',
    date_dpe: '',
    presence_panneaux_solaires: false,
    type_isolation: '',
    commentaires: '',
  });

  useEffect(() => {
    if (equipementsEnergetiques) {
      setFormData({
        chauffage_type: equipementsEnergetiques.chauffage_type || '',
        eau_chaude_type: equipementsEnergetiques.eau_chaude_type || '',
        dpe_classe: equipementsEnergetiques.dpe_classe || '',
        ges_classe: equipementsEnergetiques.ges_classe || '',
        date_dpe: equipementsEnergetiques.date_dpe 
          ? new Date(equipementsEnergetiques.date_dpe).toISOString().split('T')[0] 
          : '',
        presence_panneaux_solaires: equipementsEnergetiques.presence_panneaux_solaires || false,
        type_isolation: equipementsEnergetiques.type_isolation || '',
        commentaires: equipementsEnergetiques.commentaires || '',
      });
    }
  }, [equipementsEnergetiques]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        etat_des_lieux_id: etatId,
        ...formData,
      };

      await updateEquipementsEnergetiquesMutation.mutateAsync(dataToSave);
      toast.success('Équipements énergétiques sauvegardés');
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Chargement des équipements énergétiques...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements énergétiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chauffage_type">Type de chauffage</Label>
            <Input
              id="chauffage_type"
              value={formData.chauffage_type}
              onChange={(e) => handleInputChange('chauffage_type', e.target.value)}
              placeholder="Ex: Électrique, Gaz, Collectif, Fioul..."
            />
          </div>
          <div>
            <Label htmlFor="eau_chaude_type">Type de production d'eau chaude</Label>
            <Input
              id="eau_chaude_type"
              value={formData.eau_chaude_type}
              onChange={(e) => handleInputChange('eau_chaude_type', e.target.value)}
              placeholder="Ex: Électrique, Gaz, Collectif, Solaire..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dpe_classe">Classe DPE</Label>
            <Input
              id="dpe_classe"
              value={formData.dpe_classe}
              onChange={(e) => handleInputChange('dpe_classe', e.target.value)}
              placeholder="Ex: A, B, C, D, E, F, G"
              maxLength={1}
            />
          </div>
          <div>
            <Label htmlFor="ges_classe">Classe GES</Label>
            <Input
              id="ges_classe"
              value={formData.ges_classe}
              onChange={(e) => handleInputChange('ges_classe', e.target.value)}
              placeholder="Ex: A, B, C, D, E, F, G"
              maxLength={1}
            />
          </div>
          <div>
            <Label htmlFor="date_dpe">Date du DPE</Label>
            <Input
              id="date_dpe"
              type="date"
              value={formData.date_dpe}
              onChange={(e) => handleInputChange('date_dpe', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="presence_panneaux_solaires"
              checked={formData.presence_panneaux_solaires}
              onCheckedChange={(checked) => handleInputChange('presence_panneaux_solaires', checked as boolean)}
            />
            <Label htmlFor="presence_panneaux_solaires">Présence de panneaux solaires</Label>
          </div>
          <div>
            <Label htmlFor="type_isolation">Type d'isolation</Label>
            <Input
              id="type_isolation"
              value={formData.type_isolation}
              onChange={(e) => handleInputChange('type_isolation', e.target.value)}
              placeholder="Ex: Intérieure, Extérieure, Combles..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleInputChange('commentaires', e.target.value)}
            placeholder="Ajoutez vos observations sur les équipements énergétiques..."
            rows={4}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateEquipementsEnergetiquesMutation.isPending || !etatId}
          className="w-full"
        >
          {updateEquipementsEnergetiquesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipementsEnergetiquesStep;
