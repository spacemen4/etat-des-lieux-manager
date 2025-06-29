
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEtatDesLieuxById, useUpdateEtatDesLieuxGeneral } from '@/hooks/useEtatDesLieux';

interface GeneralStepProps {
  etatId: string;
}

const GeneralStep: React.FC<GeneralStepProps> = ({ etatId }) => {
  const { data: etatDesLieuxInitial, isLoading } = useEtatDesLieuxById(etatId);
  const { mutate: updateEtatDesLieux, isLoading: isUpdating } = useUpdateEtatDesLieuxGeneral();

  const [formData, setFormData] = useState({
    adresse_bien: '',
    type_bien: '',
    bailleur_nom: '',
    locataire_nom: '',
    date_entree: '',
  });

  useEffect(() => {
    if (etatDesLieuxInitial) {
      setFormData({
        adresse_bien: etatDesLieuxInitial.adresse_bien || '',
        type_bien: etatDesLieuxInitial.type_bien || '',
        bailleur_nom: etatDesLieuxInitial.bailleur_nom || '',
        locataire_nom: etatDesLieuxInitial.locataire_nom || '',
        date_entree: etatDesLieuxInitial.date_entree || '',
      });
    }
  }, [etatDesLieuxInitial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    // Construct the payload, ensuring you only send necessary fields for update
    // The useUpdateEtatSortie hook expects id, date_sortie, statut.
    // This needs to be adjusted if it's for general info or a new hook is needed.
    // For now, let's assume we are updating general info and the hook can handle it,
    // or we'll adjust the hook in the next step.
    // This is a placeholder save function. The actual update logic might differ.
    updateEtatDesLieux({ id: etatId, ...formData }, {
      onSuccess: () => {
        toast.success('Informations générales sauvegardées');
      },
      onError: () => {
        toast.error('Erreur lors de la sauvegarde');
      }
    });
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adresse_bien">Adresse du bien</Label>
            <Input 
              id="adresse_bien"
              value={formData.adresse_bien}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="type_bien">Type de bien</Label>
            <Input 
              id="type_bien" 
              value={formData.type_bien}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bailleur_nom">Bailleur</Label>
            <Input 
              id="bailleur_nom"
              value={formData.bailleur_nom}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="locataire_nom">Locataire</Label>
            <Input 
              id="locataire_nom"
              value={formData.locataire_nom}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date_entree">Date d'entrée</Label>
          <Input 
            id="date_entree" 
            type="date"
            value={formData.date_entree}
            onChange={handleChange}
          />
        </div>
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GeneralStep;
