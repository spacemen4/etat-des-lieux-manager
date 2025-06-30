// EquipementsEnergetiquesStep.tsx
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
  const { data: equipementsEnergetiques, refetch, isLoading, error } = useEquipementsEnergetiquesByEtatId(etatId);
  const updateEquipementsEnergetiquesMutation = useUpdateEquipementsEnergetiques();

  const [formData, setFormData] = useState({
    chauffage_type: '',
    eau_chaude_type: '',
  });

  // Debug: Log des données reçues
  useEffect(() => {
    console.log('=== EQUIPEMENTS ENERGETIQUES DEBUG ===');
    console.log('etatId:', etatId);
    console.log('equipementsEnergetiques data:', equipementsEnergetiques);
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('========================================');
  }, [etatId, equipementsEnergetiques, isLoading, error]);

  useEffect(() => {
    if (equipementsEnergetiques) {
      console.log('Mise à jour formData avec:', equipementsEnergetiques);
      setFormData({
        chauffage_type: equipementsEnergetiques.chauffage_type || '',
        eau_chaude_type: equipementsEnergetiques.eau_chaude_type || '',
      });
    } else {
      console.log('Aucune données équipements énergétiques, initialisation vide');
      setFormData({
        chauffage_type: '',
        eau_chaude_type: '',
      });
    }
  }, [equipementsEnergetiques]);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Modification champ ${field}:`, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    console.log('=== DEBUT SAUVEGARDE EQUIPEMENTS ENERGETIQUES ===');
    console.log('etatId:', etatId);
    console.log('formData avant sauvegarde:', formData);
    
    const dataToSave = {
      etat_des_lieux_id: etatId,
      ...formData,
    };
    console.log('Données à sauvegarder:', dataToSave);

    try {
      console.log('Appel mutation...');
      const result = await updateEquipementsEnergetiquesMutation.mutateAsync(dataToSave);
      console.log('Résultat mutation:', result);
      
      toast.success('Équipements énergétiques sauvegardés');
      console.log('Rechargement des données...');
      await refetch();
      console.log('=== SAUVEGARDE REUSSIE ===');
      
    } catch (error) {
      console.error('=== ERREUR LORS DE LA SAUVEGARDE ===');
      console.error('Type d\'erreur:', typeof error);
      console.error('Erreur complète:', error);
      console.error('Message d\'erreur:', error?.message);
      console.error('Stack trace:', error?.stack);
      
      // Vérification des erreurs Supabase spécifiques
      if (error?.code) {
        console.error('Code erreur Supabase:', error.code);
      }
      if (error?.details) {
        console.error('Détails erreur Supabase:', error.details);
      }
      if (error?.hint) {
        console.error('Indice erreur Supabase:', error.hint);
      }

      // Gestion spécifique des erreurs courantes
      let errorMessage = 'Erreur lors de la sauvegarde';
      
      if (error?.message?.includes('duplicate key')) {
        errorMessage = 'Erreur : Clé dupliquée';
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = 'Erreur : Référence invalide (état des lieux introuvable)';
      } else if (error?.message?.includes('null value')) {
        errorMessage = 'Erreur : Valeur requise manquante';
      } else if (error?.code === 'PGRST301') {
        errorMessage = 'Erreur : Permissions insuffisantes';
      } else if (error?.message) {
        errorMessage = `Erreur : ${error.message}`;
      }
      
      toast.error(errorMessage);
      console.error('=== FIN ERREUR ===');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des équipements énergétiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Erreur lors du chargement:', error);
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p>Erreur lors du chargement des équipements énergétiques</p>
          <Button onClick={() => refetch()} className="mt-2">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Debug: Affichage des informations pour le développement
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="space-y-4">
      {isDevelopment && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Debug Info - Équipements Énergétiques</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="space-y-1">
              <p><strong>EtatId:</strong> {etatId}</p>
              <p><strong>Has data:</strong> {equipementsEnergetiques ? 'Oui' : 'Non'}</p>
              <p><strong>Loading:</strong> {isLoading ? 'Oui' : 'Non'}</p>
              <p><strong>Error:</strong> {error ? error.message : 'Aucune'}</p>
              <p><strong>Mutation pending:</strong> {updateEquipementsEnergetiquesMutation.isPending ? 'Oui' : 'Non'}</p>
              <p><strong>FormData:</strong> {JSON.stringify(formData)}</p>
            </div>
          </CardContent>
        </Card>
      )}

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

          <Button
            onClick={handleSave}
            disabled={updateEquipementsEnergetiquesMutation.isPending || !etatId}
            className="w-full"
          >
            {updateEquipementsEnergetiquesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipementsEnergetiquesStep;