
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEtatDesLieuxById } from '@/hooks/useEtatDesLieux';

interface GeneralStepProps {
  etatId: string;
}

const GeneralStep: React.FC<GeneralStepProps> = ({ etatId }) => {
  const { data: etatDesLieux, isLoading } = useEtatDesLieuxById(etatId);

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
            <Label htmlFor="adresse">Adresse du bien</Label>
            <Input 
              id="adresse" 
              value={etatDesLieux?.adresse_bien || ''} 
            />
          </div>
          <div>
            <Label htmlFor="type_bien">Type de bien</Label>
            <Input 
              id="type_bien" 
              value={etatDesLieux?.type_bien || ''} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bailleur">Bailleur</Label>
            <Input 
              id="bailleur" 
              value={etatDesLieux?.bailleur_nom || ''} 
            />
          </div>
          <div>
            <Label htmlFor="locataire">Locataire</Label>
            <Input 
              id="locataire" 
              value={etatDesLieux?.locataire_nom || ''} 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date_entree">Date d'entrée</Label>
          <Input 
            id="date_entree" 
            type="date"
            value={etatDesLieux?.date_entree || ''} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralStep;
