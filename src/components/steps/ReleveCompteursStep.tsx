import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReleveCompteursByEtatId, useUpdateReleveCompteurs } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Zap, Flame, Droplets } from 'lucide-react';

interface ReleveCompteursStepProps {
  etatId: string;
}

const ReleveCompteursStep: React.FC<ReleveCompteursStepProps> = ({ etatId }) => {
  const { data: releveCompteurs, refetch, isLoading } = useReleveCompteursByEtatId(etatId);
  const updateReleveCompteursMutation = useUpdateReleveCompteurs();

  const [formData, setFormData] = useState({
    electricite_h_pleines: '',
    electricite_h_creuses: '',
    gaz_naturel_releve: '',
    eau_chaude_m3: '',
    eau_froide_m3: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (releveCompteurs) {
      const newFormData = {
        electricite_h_pleines: releveCompteurs.electricite_h_pleines?.toString() || '',
        electricite_h_creuses: releveCompteurs.electricite_h_creuses?.toString() || '',
        gaz_naturel_releve: releveCompteurs.gaz_naturel_releve?.toString() || '',
        eau_chaude_m3: releveCompteurs.eau_chaude_m3?.toString() || '',
        eau_froide_m3: releveCompteurs.eau_froide_m3?.toString() || '',
      };
      setFormData(newFormData);
    }
  }, [releveCompteurs]);

  const validateField = (field: string, value: string): string => {
    if (value && isNaN(Number(value))) {
      return 'Veuillez saisir un nombre valide';
    }
    if (value && Number(value) < 0) {
      return 'La valeur ne peut pas être négative';
    }
    return '';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation en temps réel
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    try {
      // Conversion des valeurs en nombres ou null si vide
      const payload = {
        // Include the id if updating existing record
        ...(releveCompteurs?.id && { id: releveCompteurs.id }),
        etat_des_lieux_id: etatId,
        electricite_h_pleines: formData.electricite_h_pleines ? formData.electricite_h_pleines : null,
        electricite_h_creuses: formData.electricite_h_creuses ? formData.electricite_h_creuses : null,
        gaz_naturel_releve: formData.gaz_naturel_releve ? formData.gaz_naturel_releve : null,
        eau_chaude_m3: formData.eau_chaude_m3 ? formData.eau_chaude_m3 : null,
        eau_froide_m3: formData.eau_froide_m3 ? formData.eau_froide_m3 : null,
      };

      await updateReleveCompteursMutation.mutateAsync(payload);
      toast.success('Relevé des compteurs sauvegardé');
      refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const hasErrors = Object.values(errors).some(error => error !== '');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-1">
            Relevé de sortie
          </Badge>
          Relevé des compteurs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Renseignez les index de sortie de tous les compteurs présents dans le logement
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Électricité */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Électricité</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="electricite_h_pleines" className="flex items-center gap-2">
                Heures pleines
                <Badge variant="secondary" className="text-xs">kWh</Badge>
              </Label>
              <Input
                id="electricite_h_pleines"
                type="text"
                value={formData.electricite_h_pleines}
                onChange={(e) => handleInputChange('electricite_h_pleines', e.target.value)}
                placeholder="Ex: 12345.67"
                className={errors.electricite_h_pleines ? 'border-red-500' : ''}
              />
              {errors.electricite_h_pleines && (
                <p className="text-sm text-red-500 mt-1">{errors.electricite_h_pleines}</p>
              )}
            </div>
            <div>
              <Label htmlFor="electricite_h_creuses" className="flex items-center gap-2">
                Heures creuses
                <Badge variant="secondary" className="text-xs">kWh</Badge>
              </Label>
              <Input
                id="electricite_h_creuses"
                type="text"
                value={formData.electricite_h_creuses}
                onChange={(e) => handleInputChange('electricite_h_creuses', e.target.value)}
                placeholder="Ex: 8765.43"
                className={errors.electricite_h_creuses ? 'border-red-500' : ''}
              />
              {errors.electricite_h_creuses && (
                <p className="text-sm text-red-500 mt-1">{errors.electricite_h_creuses}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section Gaz */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Gaz naturel</h3>
          </div>
          <div>
            <Label htmlFor="gaz_naturel_releve" className="flex items-center gap-2">
              Index gaz naturel
              <Badge variant="secondary" className="text-xs">m³</Badge>
            </Label>
            <Input
              id="gaz_naturel_releve"
              type="text"
              value={formData.gaz_naturel_releve}
              onChange={(e) => handleInputChange('gaz_naturel_releve', e.target.value)}
              placeholder="Ex: 2345.12"
              className={errors.gaz_naturel_releve ? 'border-red-500' : ''}
            />
            {errors.gaz_naturel_releve && (
              <p className="text-sm text-red-500 mt-1">{errors.gaz_naturel_releve}</p>
            )}
          </div>
        </div>

        {/* Section Eau */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Droplets className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Eau</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eau_chaude_m3" className="flex items-center gap-2">
                Eau chaude
                <Badge variant="secondary" className="text-xs">m³</Badge>
              </Label>
              <Input
                id="eau_chaude_m3"
                type="text"
                value={formData.eau_chaude_m3}
                onChange={(e) => handleInputChange('eau_chaude_m3', e.target.value)}
                placeholder="Ex: 123.45"
                className={errors.eau_chaude_m3 ? 'border-red-500' : ''}
              />
              {errors.eau_chaude_m3 && (
                <p className="text-sm text-red-500 mt-1">{errors.eau_chaude_m3}</p>
              )}
            </div>
            <div>
              <Label htmlFor="eau_froide_m3" className="flex items-center gap-2">
                Eau froide
                <Badge variant="secondary" className="text-xs">m³</Badge>
              </Label>
              <Input
                id="eau_froide_m3"
                type="text"
                value={formData.eau_froide_m3}
                onChange={(e) => handleInputChange('eau_froide_m3', e.target.value)}
                placeholder="Ex: 456.78"
                className={errors.eau_froide_m3 ? 'border-red-500' : ''}
              />
              {errors.eau_froide_m3 && (
                <p className="text-sm text-red-500 mt-1">{errors.eau_froide_m3}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={updateReleveCompteursMutation.isPending || hasErrors}
            className="w-full"
            size="lg"
          >
            {updateReleveCompteursMutation.isPending ? 'Sauvegarde en cours...' : 'Sauvegarder le relevé'}
          </Button>
          {hasErrors && (
            <p className="text-sm text-red-500 mt-2 text-center">
              Veuillez corriger les erreurs avant de sauvegarder
            </p>
            )}
        </div>

        {/* Note informative */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour le relevé</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Relevez les index au plus près de la date de sortie</li>
            <li>• Vérifiez que les compteurs fonctionnent correctement</li>
            <li>• Notez l'emplacement des compteurs si nécessaire</li>
            <li>• Les champs vides seront ignorés lors de la sauvegarde</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReleveCompteursStep;
