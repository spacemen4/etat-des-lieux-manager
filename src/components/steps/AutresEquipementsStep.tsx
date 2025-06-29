
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAutresEquipementsByEtatId, useUpdateAutreEquipement } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface AutresEquipementsStepProps {
  etatId: string;
}

const AutresEquipementsStep: React.FC<AutresEquipementsStepProps> = ({ etatId }) => {
  const { data: autresEquipements, refetch } = useAutresEquipementsByEtatId(etatId);
  const updateAutreEquipementMutation = useUpdateAutreEquipement();

  const [equipementsList, setEquipementsList] = useState<any[]>([]);

  useEffect(() => {
    if (autresEquipements) {
      setEquipementsList(autresEquipements);
    }
  }, [autresEquipements]);

  const handleInputChange = (index: number, field: string, value: string) => {
    setEquipementsList(prev => prev.map((equipement, i) => 
      i === index ? { ...equipement, [field]: value } : equipement
    ));
  };

  const addNewEquipement = () => {
    setEquipementsList(prev => [...prev, {
      etat_des_lieux_id: etatId,
      equipement: '',
      etat_sortie: '',
      commentaires: '',
    }]);
  };

  const removeEquipement = (index: number) => {
    setEquipementsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      for (const equipement of equipementsList) {
        await updateAutreEquipementMutation.mutateAsync(equipement);
      }
      toast.success('Autres équipements sauvegardés');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Autres équipements
          <Button onClick={addNewEquipement} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {equipementsList.map((equipement, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Équipement #{index + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeEquipement(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <Label htmlFor={`equipement_${index}`}>Nom de l'équipement</Label>
              <Input
                id={`equipement_${index}`}
                value={equipement.equipement || ''}
                onChange={(e) => handleInputChange(index, 'equipement', e.target.value)}
                placeholder="Ex: Sonnette, Boîte aux lettres, Internet..."
              />
            </div>
            
            <div>
              <Label htmlFor={`etat_sortie_${index}`}>État de sortie</Label>
              <Input
                id={`etat_sortie_${index}`}
                value={equipement.etat_sortie || ''}
                onChange={(e) => handleInputChange(index, 'etat_sortie', e.target.value)}
                placeholder="État de l'équipement"
              />
            </div>
            
            <div>
              <Label htmlFor={`commentaires_${index}`}>Commentaires</Label>
              <Input
                id={`commentaires_${index}`}
                value={equipement.commentaires || ''}
                onChange={(e) => handleInputChange(index, 'commentaires', e.target.value)}
                placeholder="Commentaires optionnels"
              />
            </div>
          </div>
        ))}

        {equipementsList.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun équipement ajouté. Cliquez sur "Ajouter" pour commencer.
          </p>
        )}

        <Button 
          onClick={handleSave} 
          disabled={updateAutreEquipementMutation.isPending}
          className="w-full"
        >
          {updateAutreEquipementMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AutresEquipementsStep;
