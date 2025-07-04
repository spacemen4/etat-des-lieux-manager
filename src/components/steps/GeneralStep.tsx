import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEtatDesLieuxById, useUpdateEtatDesLieux, useRendezVousById } from '@/hooks/useEtatDesLieux';

interface GeneralStepProps {
  etatId: string;
}

const GeneralStep: React.FC<GeneralStepProps> = ({ etatId }) => {
  const { data: etatDesLieuxInitial, isLoading } = useEtatDesLieuxById(etatId);
  const { data: rendezVousData } = useRendezVousById(etatDesLieuxInitial?.rendez_vous_id || null);
  const { mutate: updateEtatDesLieux, isPending: isUpdating } = useUpdateEtatDesLieux();

  const [formData, setFormData] = useState({
    adresse_bien: '',
    type_etat_des_lieux: '' as 'entree' | 'sortie' | '',
    type_bien: '' as 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires' | '',
    bailleur_nom: '',
    bailleur_adresse: '',
    locataire_nom: '',
    locataire_adresse: '',
    date_entree: '',
    date_sortie: '',
    statut: '',
  });

  // Options pour les sélecteurs
  const typeEtatDesLieuxOptions = [
    { value: 'entree', label: 'Entrée' },
    { value: 'sortie', label: 'Sortie' }
  ];

  const typeBienOptions = [
    { value: 'studio', label: 'Studio' },
    { value: 't2_t3', label: 'T2/T3' },
    { value: 't4_t5', label: 'T4/T5' },
    { value: 'inventaire_mobilier', label: 'Inventaire mobilier' },
    { value: 'bureau', label: 'Bureau' },
    { value: 'local_commercial', label: 'Local commercial' },
    { value: 'garage_box', label: 'Garage/Box' },
    { value: 'pieces_supplementaires', label: 'Pièces supplémentaires' }
  ];

  const statutOptions = [
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'valide', label: 'Validé' }
  ];

  useEffect(() => {
    if (etatDesLieuxInitial) {
      setFormData({
        adresse_bien: etatDesLieuxInitial.adresse_bien || '',
        type_etat_des_lieux: etatDesLieuxInitial.type_etat_des_lieux || '',
        type_bien: etatDesLieuxInitial.type_bien || '',
        bailleur_nom: etatDesLieuxInitial.bailleur_nom || '',
        bailleur_adresse: etatDesLieuxInitial.bailleur_adresse || '',
        locataire_nom: etatDesLieuxInitial.locataire_nom || '',
        locataire_adresse: etatDesLieuxInitial.locataire_adresse || '',
        date_entree: etatDesLieuxInitial.date_entree || '',
        date_sortie: etatDesLieuxInitial.date_sortie || '',
        statut: etatDesLieuxInitial.statut || '',
      });
    }
  }, [etatDesLieuxInitial]);

  // New useEffect to pre-fill data from rendez-vous
  useEffect(() => {
    if (rendezVousData && (!formData.type_etat_des_lieux || !formData.type_bien)) {
      setFormData(prev => ({
        ...prev,
        type_etat_des_lieux: prev.type_etat_des_lieux || rendezVousData.type_etat_des_lieux || '',
        type_bien: prev.type_bien || rendezVousData.type_bien || '',
        adresse_bien: prev.adresse_bien || rendezVousData.adresse || '',
      }));
    }
  }, [rendezVousData, formData.type_etat_des_lieux, formData.type_bien]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    let newStatut = formData.statut;
    // If date_sortie is being cleared, set statut to 'en_cours'
    if (etatDesLieuxInitial?.date_sortie && !formData.date_sortie) {
      newStatut = 'en_cours';
    }
    // If date_sortie is being set or already exists, and current statut is not 'finalise', set to 'finalise'
    // However, the main finalization is handled by EtatSortieForm's last step.
    // Here, we primarily care about reverting to 'en_cours' if date_sortie is cleared.
    // If date_sortie has a value, we can assume it's 'finalise' or will become 'finalise'
    // unless the user explicitly changes the statut dropdown to something else (which is less likely for a sortie).
    else if (formData.date_sortie && formData.statut !== 'finalise') {
      // If a sortie date is present, the status should reflect a completed state.
      // Let's ensure it's 'finalise' unless it's being cleared.
      // The dropdown for 'statut' might still allow other values, but this logic nudges it.
      // The 'finalise' status is primarily set by the last step of EtatSortieForm.
      // This step should ensure that if date_sortie is present, status isn't 'en_cours'.
      if (newStatut === 'en_cours') {
         newStatut = 'finalise'; // Or rely on the existing formData.statut if user picked something specific
      }
    }


    // Type validation before sending
    const validatedData = {
      id: etatId,
      adresse_bien: formData.adresse_bien,
      type_etat_des_lieux: formData.type_etat_des_lieux as 'entree' | 'sortie',
      type_bien: formData.type_bien as 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires',
      bailleur_nom: formData.bailleur_nom,
      bailleur_adresse: formData.bailleur_adresse,
      locataire_nom: formData.locataire_nom,
      locataire_adresse: formData.locataire_adresse,
      date_entree: formData.date_entree || null, // Ensure null if empty
      date_sortie: formData.date_sortie || null, // Ensure null if empty
      statut: newStatut,
    };

    updateEtatDesLieux(
      validatedData,
      {
        onSuccess: () => {
          toast.success('Informations générales sauvegardées');
        },
        onError: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          toast.error('Erreur lors de la sauvegarde');
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        {rendezVousData && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            Informations pré-remplies depuis le rendez-vous du {new Date(rendezVousData.date).toLocaleDateString('fr-FR')}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section: Informations sur le bien */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Bien immobilier</h3>
          
          <div>
            <Label htmlFor="adresse_bien">Adresse du bien *</Label>
            <Input
              id="adresse_bien"
              value={formData.adresse_bien}
              onChange={handleInputChange}
              placeholder="Adresse complète du bien"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_etat_des_lieux">Type d'état des lieux *</Label>
              <Select
                value={formData.type_etat_des_lieux}
                onValueChange={(value) => handleSelectChange('type_etat_des_lieux', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {typeEtatDesLieuxOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type_bien">Type de bien *</Label>
              <Select
                value={formData.type_bien}
                onValueChange={(value) => handleSelectChange('type_bien', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type de bien" />
                </SelectTrigger>
                <SelectContent>
                  {typeBienOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section: Dates */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Dates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_entree">Date d'entrée</Label>
              <Input
                id="date_entree"
                type="date"
                value={formData.date_entree}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="date_sortie">Date de sortie</Label>
              <Input
                id="date_sortie"
                type="date"
                value={formData.date_sortie}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Section: Bailleur */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Bailleur</h3>
          
          <div>
            <Label htmlFor="bailleur_nom">Nom du bailleur</Label>
            <Input
              id="bailleur_nom"
              value={formData.bailleur_nom}
              onChange={handleInputChange}
              placeholder="Nom complet du bailleur ou de son représentant"
            />
          </div>

          <div>
            <Label htmlFor="bailleur_adresse">Adresse du bailleur</Label>
            <Input
              id="bailleur_adresse"
              value={formData.bailleur_adresse}
              onChange={handleInputChange}
              placeholder="Adresse complète du bailleur"
            />
          </div>
        </div>

        {/* Section: Locataire */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Locataire</h3>
          
          <div>
            <Label htmlFor="locataire_nom">Nom du locataire</Label>
            <Input
              id="locataire_nom"
              value={formData.locataire_nom}
              onChange={handleInputChange}
              placeholder="Nom complet du ou des locataires"
            />
          </div>

          <div>
            <Label htmlFor="locataire_adresse">Adresse du locataire</Label>
            <Input
              id="locataire_adresse"
              value={formData.locataire_adresse}
              onChange={handleInputChange}
              placeholder="Adresse complète du locataire"
            />
          </div>
        </div>

        {/* Section: Statut */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Statut</h3>
          
          <div>
            <Label htmlFor="statut">Statut de l'état des lieux</Label>
            <Select
              value={formData.statut}
              onValueChange={(value) => handleSelectChange('statut', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                {statutOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            {isUpdating ? 'Enregistrement...' : 'Sauvegarder les informations'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralStep;
