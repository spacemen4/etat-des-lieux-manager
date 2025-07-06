
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAutresEquipementsByEtatId, useUpdateAutreEquipement } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, X } from 'lucide-react';

interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  file_path: string;
}

interface AutresEquipementsStepProps {
  etatId: string;
}

const AutresEquipementsStep: React.FC<AutresEquipementsStepProps> = ({ etatId }) => {
  const { data: autresEquipements, refetch } = useAutresEquipementsByEtatId(etatId);
  const updateAutreEquipementMutation = useUpdateAutreEquipement();

  const [equipementsList, setEquipementsList] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<Record<number, (File & { description?: string })[]>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
      etat_entree: '',
      etat_sortie: '',
      commentaires: '',
    }]);
  };

  const removeEquipement = (index: number) => {
    setEquipementsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, equipementIndex: number) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: (File & { description?: string })[] = [];
    const maxSize = 5 * 1024 * 1024;

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`Le fichier ${file.name} n'est pas une image`);
        return;
      }
      const fileWithDescription = file as File & { description?: string };
      fileWithDescription.description = '';
      validFiles.push(fileWithDescription);
    });

    setNewPhotos(prev => ({
      ...prev,
      [equipementIndex]: [...(prev[equipementIndex] || []), ...validFiles]
    }));
  };

  const handleRemoveNewPhoto = (equipementIndex: number, photoIndex: number) => {
    setNewPhotos(prev => {
      const equipementPhotos = [...(prev[equipementIndex] || [])];
      equipementPhotos.splice(photoIndex, 1);
      return { ...prev, [equipementIndex]: equipementPhotos };
    });
  };

  const uploadPhotos = async (equipementIndex: number): Promise<Photo[]> => {
    const photos = newPhotos[equipementIndex] || [];
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotos: Photo[] = [];

    for (const photo of photos) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${etatId}/autres_equipements/${equipementIndex}/${timestamp}_${randomId}_${photo.name}`;
      
      const uploadedPhoto: Photo = {
        id: `${timestamp}_${randomId}`,
        name: photo.name,
        size: photo.size,
        type: photo.type,
        url: `placeholder-url-${fileName}`,
        description: photo.description || '',
        file_path: fileName
      };
      uploadedPhotos.push(uploadedPhoto);
    }

    setUploadingPhotos(false);
    return uploadedPhotos;
  };

  const handleSave = async () => {
    try {
      for (let i = 0; i < equipementsList.length; i++) {
        const equipement = equipementsList[i];
        const uploadedPhotos = await uploadPhotos(i);
        const existingPhotos = equipement.photos || [];
        const allPhotos = [...existingPhotos, ...uploadedPhotos];
        
        await updateAutreEquipementMutation.mutateAsync({
          ...equipement,
          photos: allPhotos
        });
      }
      
      setNewPhotos({});
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`etat_entree_${index}`}>État d'entrée</Label>
                <Input
                  id={`etat_entree_${index}`}
                  value={equipement.etat_entree || ''}
                  onChange={(e) => handleInputChange(index, 'etat_entree', e.target.value)}
                  placeholder="État à l'entrée"
                />
              </div>
              <div>
                <Label htmlFor={`etat_sortie_${index}`}>État de sortie</Label>
                <Input
                  id={`etat_sortie_${index}`}
                  value={equipement.etat_sortie || ''}
                  onChange={(e) => handleInputChange(index, 'etat_sortie', e.target.value)}
                  placeholder="État de sortie"
                />
              </div>
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

            {/* Section Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Photos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current[index]?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Ajouter photos
                </Button>
                <input
                  ref={(el) => fileInputRefs.current[index] = el}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, index)}
                  className="hidden"
                />
              </div>

              {/* Nouvelles photos */}
              {newPhotos[index] && newPhotos[index].length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {newPhotos[index].map((photo, photoIndex) => (
                    <div key={photoIndex} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <div className="absolute top-1 right-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveNewPhoto(index, photoIndex)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description..."
                        value={photo.description || ''}
                        className="mt-1 text-xs"
                        onChange={(e) => {
                          const equipementPhotos = [...(newPhotos[index] || [])];
                          equipementPhotos[photoIndex] = { ...equipementPhotos[photoIndex], description: e.target.value };
                          setNewPhotos(prev => ({ ...prev, [index]: equipementPhotos }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
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
          disabled={updateAutreEquipementMutation.isPending || uploadingPhotos}
          className="w-full"
        >
          {uploadingPhotos ? 'Upload photos...' : updateAutreEquipementMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AutresEquipementsStep;
