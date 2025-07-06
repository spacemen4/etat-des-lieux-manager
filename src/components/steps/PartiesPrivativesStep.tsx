
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePartiesPrivativesByEtatId, useUpdatePartiePrivative } from '@/hooks/useEtatDesLieux';
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

interface PartiesPrivativesStepProps {
  etatId: string;
}

const PartiesPrivativesStep: React.FC<PartiesPrivativesStepProps> = ({ etatId }) => {
  const { data: partiesPrivatives, refetch } = usePartiesPrivativesByEtatId(etatId);
  const updatePartiePrivativeMutation = useUpdatePartiePrivative();

  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<Record<number, (File & { description?: string })[]>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, partieIndex: number) => {
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
      [partieIndex]: [...(prev[partieIndex] || []), ...validFiles]
    }));
  };

  const handleRemoveNewPhoto = (partieIndex: number, photoIndex: number) => {
    setNewPhotos(prev => {
      const partiePhotos = [...(prev[partieIndex] || [])];
      partiePhotos.splice(photoIndex, 1);
      return { ...prev, [partieIndex]: partiePhotos };
    });
  };

  const uploadPhotos = async (partieIndex: number): Promise<Photo[]> => {
    const photos = newPhotos[partieIndex] || [];
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotos: Photo[] = [];

    for (const photo of photos) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${etatId}/parties_privatives/${partieIndex}/${timestamp}_${randomId}_${photo.name}`;
      
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
      for (let i = 0; i < partiesList.length; i++) {
        const partie = partiesList[i];
        const uploadedPhotos = await uploadPhotos(i);
        const existingPhotos = partie.photos || [];
        const allPhotos = [...existingPhotos, ...uploadedPhotos];
        
        await updatePartiePrivativeMutation.mutateAsync({
          ...partie,
          photos: allPhotos
        });
      }
      
      setNewPhotos({});
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
                          const partiePhotos = [...(newPhotos[index] || [])];
                          partiePhotos[photoIndex] = { ...partiePhotos[photoIndex], description: e.target.value };
                          setNewPhotos(prev => ({ ...prev, [index]: partiePhotos }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
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
          disabled={updatePartiePrivativeMutation.isPending || uploadingPhotos}
          className="w-full"
        >
          {uploadingPhotos ? 'Upload photos...' : updatePartiePrivativeMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartiesPrivativesStep;
