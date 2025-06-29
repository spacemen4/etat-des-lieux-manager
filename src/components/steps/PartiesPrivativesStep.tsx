
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePartiesPrivativesByEtatId, useUpdatePartiePrivative } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface PartiesPrivativesStepProps {
  etatId: string;
}

const PartiesPrivativesStep: React.FC<PartiesPrivativesStepProps> = ({ etatId }) => {
  const { data: partiesPrivatives, refetch } = usePartiesPrivativesByEtatId(etatId);
  const updatePartiePrivativeMutation = useUpdatePartiePrivative();

  const [partiesList, setPartiesList] = useState<any[]>([]);

  useEffect(() => {
    if (partiesPrivatives) {
      setPartiesList(partiesPrivatives);
    }
  }, [partiesPrivatives]);

  const handleInputChange = (index: number, field: string, value: string) => {
    setPartiesList(prev => prev.map((partie, i) => 
      i === index ? { ...partie, [field]: value } : partie
    ));
  };

  const addNewPartie = () => {
    setPartiesList(prev => [...prev, {
      etat_des_lieux_id: etatId,
      type_partie: '',
      etat_sortie: '',
      numero: '',
      commentaires: '',
    }]);
  };

  const removePartie = (index: number) => {
    setPartiesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      for (const partie of partiesList) {
        await updatePartiePrivativeMutation.mutateAsync(partie);
      }
      toast.success('Parties privatives sauvegardées');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Parties privatives
          <Button onClick={addNewPartie} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {partiesList.map((partie, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Partie privative #{index + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removePartie(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`type_partie_${index}`}>Type de partie</Label>
                <Input
                  id={`type_partie_${index}`}
                  value={partie.type_partie || ''}
                  onChange={(e) => handleInputChange(index, 'type_partie', e.target.value)}
                  placeholder="Ex: Cave, Parking, Jardin..."
                />
              </div>
              <div>
                <Label htmlFor={`numero_${index}`}>Numéro</Label>
                <Input
                  id={`numero_${index}`}
                  value={partie.numero || ''}
                  onChange={(e) => handleInputChange(index, 'numero', e.target.value)}
                  placeholder="Ex: N°12, Box A..."
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`etat_sortie_${index}`}>État de sortie</Label>
              <Input
                id={`etat_sortie_${index}`}
                value={partie.etat_sortie || ''}
                onChange={(e) => handleInputChange(index, 'etat_sortie', e.target.value)}
                placeholder="État de la partie privative"
              />
            </div>
            
            <div>
              <Label htmlFor={`commentaires_${index}`}>Commentaires</Label>
              <Input
                id={`commentaires_${index}`}
                value={partie.commentaires || ''}
                onChange={(e) => handleInputChange(index, 'commentaires', e.target.value)}
                placeholder="Commentaires optionnels"
              />
            </div>
          </div>
        ))}

        {partiesList.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucune partie privative ajoutée. Cliquez sur "Ajouter" pour commencer.
          </p>
        )}

        <Button 
          onClick={handleSave} 
          disabled={updatePartiePrivativeMutation.isPending}
          className="w-full"
        >
          {updatePartiePrivativeMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartiesPrivativesStep;
