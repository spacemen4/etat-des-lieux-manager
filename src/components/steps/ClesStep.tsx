
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useClesByEtatId, useUpdateCles } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, X, Upload } from 'lucide-react';

interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  file_path: string;
}

interface ClesStepProps {
  etatId: string;
}

const ClesStep: React.FC<ClesStepProps> = ({ etatId }) => {
  const { data: cles, refetch } = useClesByEtatId(etatId);
  const updateClesMutation = useUpdateCles();

  const [clesList, setClesList] = useState<any[]>([]);
  const [newPhotos, setNewPhotos] = useState<Record<number, (File & { description?: string })[]>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
      numero_cle: '',
      commentaires: '',
    }]);
  };

  const removeCle = (index: number) => {
    setClesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, cleIndex: number) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: (File & { description?: string })[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

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
      [cleIndex]: [...(prev[cleIndex] || []), ...validFiles]
    }));
  };

  const handleRemoveNewPhoto = (cleIndex: number, photoIndex: number) => {
    setNewPhotos(prev => {
      const clePhotos = [...(prev[cleIndex] || [])];
      clePhotos.splice(photoIndex, 1);
      return {
        ...prev,
        [cleIndex]: clePhotos
      };
    });
  };

  const handlePhotoDescriptionChange = (cleIndex: number, photoIndex: number, description: string) => {
    setNewPhotos(prev => {
      const clePhotos = [...(prev[cleIndex] || [])];
      clePhotos[photoIndex] = { ...clePhotos[photoIndex], description };
      return {
        ...prev,
        [cleIndex]: clePhotos
      };
    });
  };

  const uploadPhotos = async (cleIndex: number): Promise<Photo[]> => {
    const photos = newPhotos[cleIndex] || [];
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotos: Photo[] = [];

    // Note: Utilisation simulée de l'upload - remplacez par votre vraie logique Supabase
    for (const photo of photos) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${etatId}/cles/${cleIndex}/${timestamp}_${randomId}_${photo.name}`;
      
      const uploadedPhoto: Photo = {
        id: `${timestamp}_${randomId}`,
        name: photo.name,
        size: photo.size,
        type: photo.type,
        url: `placeholder-url-${fileName}`, // Remplacez par l'URL réelle après upload
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
      for (let i = 0; i < clesList.length; i++) {
        const cle = clesList[i];
        const uploadedPhotos = await uploadPhotos(i);
        const existingPhotos = cle.photos || [];
        const allPhotos = [...existingPhotos, ...uploadedPhotos];
        
        await updateClesMutation.mutateAsync({
          ...cle,
          photos: allPhotos
        });
      }
      
      // Réinitialiser les nouvelles photos
      setNewPhotos({});
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <Label htmlFor={`numero_cle_${index}`}>Numéro de clé</Label>
                <Input
                  id={`numero_cle_${index}`}
                  value={cle.numero_cle || ''}
                  onChange={(e) => handleInputChange(index, 'numero_cle', e.target.value)}
                  placeholder="Numéro ou référence"
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

              {/* Photos existantes */}
              {cle.photos && cle.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {cle.photos.map((photo: Photo, photoIndex: number) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description..."
                        value={photo.description || ''}
                        className="mt-1 text-xs"
                        onChange={(e) => {
                          const updatedCles = [...clesList];
                          updatedCles[index] = {
                            ...updatedCles[index],
                            photos: updatedCles[index].photos.map((p: Photo) =>
                              p.id === photo.id ? { ...p, description: e.target.value } : p
                            )
                          };
                          setClesList(updatedCles);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

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
                        onChange={(e) => handlePhotoDescriptionChange(index, photoIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
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
          disabled={updateClesMutation.isPending || uploadingPhotos}
          className="w-full"
        >
          {uploadingPhotos ? 'Upload photos...' : updateClesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClesStep;
