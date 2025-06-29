
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useClesByEtatId, useUpdateCles } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface ClesStepProps {
  etatId: string;
}

const ClesStep: React.FC<ClesStepProps> = ({ etatId }) => {
  const { data: cles, refetch } = useClesByEtatId(etatId);
  const updateClesMutation = useUpdateCles();

  const [clesList, setClesList] = useState<any[]>([]);

  useEffect(() => {
    if (cles) {
      setClesList(cles);
    }
  }, [cles]);

  const handleInputChange = (index: number, field: string, value: string | number) => {
    setClesList(prev => prev.map((cle, i) => 
      i === index ? { ...cle, [field]: value } : cle
    ));
  };

  const addNewCle = () => {
    setClesList(prev => [...prev, {
      etat_des_lieux_id: etatId,
      type_cle_badge: '',
      nombre: 1,
      commentaires: '',
    }]);
  };

  const removeCle = (index: number) => {
    setClesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      for (const cle of clesList) {
        await updateClesMutation.mutateAsync(cle);
      }
      toast.success('Clés sauvegardées');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Remise des clés
          <Button onClick={addNewCle} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clesList.map((cle, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Clé #{index + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCle(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`type_${index}`}>Type de clé/badge</Label>
                <Input
                  id={`type_${index}`}
                  value={cle.type_cle_badge || ''}
                  onChange={(e) => handleInputChange(index, 'type_cle_badge', e.target.value)}
                  placeholder="Ex: Clé appartement, Badge..."
                />
              </div>
              <div>
                <Label htmlFor={`nombre_${index}`}>Nombre</Label>
                <Input
                  id={`nombre_${index}`}
                  type="number"
                  value={cle.nombre || 1}
                  onChange={(e) => handleInputChange(index, 'nombre', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`commentaires_${index}`}>Commentaires</Label>
              <Input
                id={`commentaires_${index}`}
                value={cle.commentaires || ''}
                onChange={(e) => handleInputChange(index, 'commentaires', e.target.value)}
                placeholder="Commentaires optionnels"
              />
            </div>
          </div>
        ))}

        {clesList.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucune clé ajoutée. Cliquez sur "Ajouter" pour commencer.
          </p>
        )}

        <Button 
          onClick={handleSave} 
          disabled={updateClesMutation.isPending}
          className="w-full"
        >
          {updateClesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClesStep;
