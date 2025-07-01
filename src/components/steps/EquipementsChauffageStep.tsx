
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
    radiateurs_nombre: 0,
    radiateurs_etat: '',
    thermostat_present: false,
    thermostat_etat: '',
    pompe_a_chaleur_present: false,
    pompe_a_chaleur_etat: '',
    commentaires: '',
  });

  useEffect(() => {
    if (equipementsChauffage) {
      setFormData({
        chaudiere_etat: equipementsChauffage.chaudiere_etat || '',
        chaudiere_date_dernier_entretien: equipementsChauffage.chaudiere_date_dernier_entretien 
          ? new Date(equipementsChauffage.chaudiere_date_dernier_entretien).toISOString().split('T')[0] 
          : '',
        ballon_eau_chaude_etat: equipementsChauffage.ballon_eau_chaude_etat || '',
        radiateurs_nombre: equipementsChauffage.radiateurs_nombre || 0,
        radiateurs_etat: equipementsChauffage.radiateurs_etat || '',
        thermostat_present: equipementsChauffage.thermostat_present || false,
        thermostat_etat: equipementsChauffage.thermostat_etat || '',
        pompe_a_chaleur_present: equipementsChauffage.pompe_a_chaleur_present || false,
        pompe_a_chaleur_etat: equipementsChauffage.pompe_a_chaleur_etat || '',
        commentaires: equipementsChauffage.commentaires || '',
      });
    }
  }, [equipementsChauffage]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!etatId) {
        toast.error('ID de l\'état des lieux manquant');
        return;
      }

      const dataToSend = {
        etat_des_lieux_id: etatId,
        ...formData,
      };

      await updateEquipementsChauffageMutation.mutateAsync(dataToSend);
      
      toast.success('Équipements de chauffage sauvegardés');
      refetch();
    } catch (error) {
      console.error('Erreur détaillée:', error);
      toast.error('Erreur lors de la sauvegarde des équipements de chauffage');
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
      <CardContent className="space-y-6">
        {/* Chaudière */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Chaudière</h3>
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
        </div>

        {/* Ballon d'eau chaude */}
        <div>
          <Label htmlFor="ballon_eau_chaude_etat">État du ballon d'eau chaude</Label>
          <Input
            id="ballon_eau_chaude_etat"
            value={formData.ballon_eau_chaude_etat}
            onChange={(e) => handleInputChange('ballon_eau_chaude_etat', e.target.value)}
            placeholder="Ex: Bon état, Défaillant, Fuite détectée..."
          />
        </div>

        {/* Radiateurs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Radiateurs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="radiateurs_nombre">Nombre de radiateurs</Label>
              <Input
                id="radiateurs_nombre"
                type="number"
                value={formData.radiateurs_nombre}
                onChange={(e) => handleInputChange('radiateurs_nombre', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="radiateurs_etat">État général des radiateurs</Label>
              <Input
                id="radiateurs_etat"
                value={formData.radiateurs_etat}
                onChange={(e) => handleInputChange('radiateurs_etat', e.target.value)}
                placeholder="Ex: Bon état, Quelques fuites, À remplacer..."
              />
            </div>
          </div>
        </div>

        {/* Thermostat */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thermostat</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="thermostat_present"
              checked={formData.thermostat_present}
              onCheckedChange={(checked) => handleInputChange('thermostat_present', checked as boolean)}
            />
            <Label htmlFor="thermostat_present">Présence d'un thermostat</Label>
          </div>
          {formData.thermostat_present && (
            <div>
              <Label htmlFor="thermostat_etat">État du thermostat</Label>
              <Input
                id="thermostat_etat"
                value={formData.thermostat_etat}
                onChange={(e) => handleInputChange('thermostat_etat', e.target.value)}
                placeholder="Ex: Fonctionne bien, Défaillant, Programmable..."
              />
            </div>
          )}
        </div>

        {/* Pompe à chaleur */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pompe à chaleur</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="pompe_a_chaleur_present"
              checked={formData.pompe_a_chaleur_present}
              onCheckedChange={(checked) => handleInputChange('pompe_a_chaleur_present', checked as boolean)}
            />
            <Label htmlFor="pompe_a_chaleur_present">Présence d'une pompe à chaleur</Label>
          </div>
          {formData.pompe_a_chaleur_present && (
            <div>
              <Label htmlFor="pompe_a_chaleur_etat">État de la pompe à chaleur</Label>
              <Input
                id="pompe_a_chaleur_etat"
                value={formData.pompe_a_chaleur_etat}
                onChange={(e) => handleInputChange('pompe_a_chaleur_etat', e.target.value)}
                placeholder="Ex: Excellent état, Entretien nécessaire, Bruyante..."
              />
            </div>
          )}
        </div>

        {/* Commentaires */}
        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleInputChange('commentaires', e.target.value)}
            placeholder="Ajoutez vos observations sur les équipements de chauffage..."
            rows={4}
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
