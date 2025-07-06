
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutresEquipementsByEtatId, useUpdateAutreEquipement, useCreateAutreEquipement, useDeleteAutreEquipement } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, X, Upload, Image as ImageIcon } from 'lucide-react';

// Configuration Supabase (simulée, adaptez avec votre vraie configuration)
const SUPABASE_URL = 'https://osqpvyrctlhagtzkbspv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXB2eXJjdGxoYWd0emtic3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg1NjYsImV4cCI6MjA2NjYwNDU2Nn0.4APWILaWXOtXCwdFYTk4MDithvZhp55ZJB6PnVn8D1w';

const supabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: formData
        });
        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
        return { data: { path }, error: null };
      },
      remove: async (paths: string[]) => {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: paths })
        });
        return { error: response.ok ? null : new Error('Delete failed') };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` }
      })
    })
  }
};

interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  category: string; // 'autres_equipements' pour ce composant
  file_path: string;
}

interface AutreEquipement {
  id?: string; // id est optionnel pour les nouveaux équipements
  etat_des_lieux_id: string;
  equipement: string;
  etat_entree: string;
  etat_sortie: string;
  commentaires: string;
  photos: Photo[];
}

interface AutresEquipementsStepProps {
  etatId: string;
}

const AutresEquipementsStep: React.FC<AutresEquipementsStepProps> = ({ etatId }) => {
  const { data: autresEquipementsData, refetch, isLoading: isLoadingData } = useAutresEquipementsByEtatId(etatId);
  const createAutreEquipementMutation = useCreateAutreEquipement();
  const updateAutreEquipementMutation = useUpdateAutreEquipement();
  const deleteAutreEquipementMutation = useDeleteAutreEquipement();

  const [equipementsList, setEquipementsList] = useState<AutreEquipement[]>([]);
  const [newPhotos, setNewPhotos] = useState<Record<number, (File & { description?: string })[]>>({}); // index de l'équipement -> liste de fichiers
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (autresEquipementsData) {
      setEquipementsList(autresEquipementsData.map(eq => ({ ...eq, photos: eq.photos || [] })));
    }
  }, [autresEquipementsData]);

  const handleInputChange = (index: number, field: keyof AutreEquipement, value: string) => {
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
      photos: [],
    }]);
  };

  const removeEquipement = async (index: number, equipementId?: string) => {
    if (equipementId) {
      try {
        await deleteAutreEquipementMutation.mutateAsync(equipementId);
        toast.success('Équipement supprimé de la base de données.');
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'équipement.');
        return; // Ne pas retirer de la liste si la suppression BDD échoue
      }
    }
    setEquipementsList(prev => prev.filter((_, i) => i !== index));
    // Nettoyer aussi les newPhotos associées si besoin
    setNewPhotos(prev => {
      const updatedNewPhotos = { ...prev };
      delete updatedNewPhotos[index];
      // Il faudrait aussi décaler les index des photos suivantes, c'est complexe.
      // Pour l'instant, on assume que l'utilisateur sauvegarde avant de trop modifier l'ordre.
      return updatedNewPhotos;
    });
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

  const handleNewPhotoDescriptionChange = (equipementIndex: number, photoIndex: number, description: string) => {
    setNewPhotos(prev => {
      const equipementPhotos = [...(prev[equipementIndex] || [])];
      equipementPhotos[photoIndex] = { ...equipementPhotos[photoIndex], description };
      return { ...prev, [equipementIndex]: equipementPhotos };
    });
  };

  const handleRemoveExistingPhoto = async (equipementIndex: number, photoId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('etat-des-lieux-photos')
        .remove([filePath]);

      if (storageError) {
        console.error('Erreur suppression storage:', storageError);
        toast.error('Erreur lors de la suppression du fichier de stockage.');
      }

      setEquipementsList(prev => prev.map((equipement, i) => {
        if (i === equipementIndex) {
          return {
            ...equipement,
            photos: equipement.photos.filter(photo => photo.id !== photoId)
          };
        }
        return equipement;
      }));
      toast.success('Photo retirée de la liste. Sauvegardez pour confirmer.');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la photo.');
    }
  };

  const handleExistingPhotoDescriptionChange = (equipementIndex: number, photoId: string, description: string) => {
    setEquipementsList(prev => prev.map((equipement, i) => {
      if (i === equipementIndex) {
        return {
          ...equipement,
          photos: equipement.photos.map(photo =>
            photo.id === photoId ? { ...photo, description } : photo
          )
        };
      }
      return equipement;
    }));
  };

  const _uploadPhotos = async (equipementIndex: number, equipementIdForPath: string): Promise<Photo[]> => {
    const photosToUpload = newPhotos[equipementIndex] || [];
    if (photosToUpload.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotosResult: Photo[] = [];

    try {
      for (const photoFile of photosToUpload) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/autres_equipements/${equipementIdForPath}/${timestamp}_${randomId}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('etat-des-lieux-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          throw new Error(`Erreur upload ${photoFile.name}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('etat-des-lieux-photos')
          .getPublicUrl(fileName);

        uploadedPhotosResult.push({
          id: `${timestamp}_${randomId}`,
          name: photoFile.name,
          size: photoFile.size,
          type: photoFile.type,
          url: publicUrlData.publicUrl,
          description: photoFile.description || '',
          category: 'autres_equipements',
          file_path: fileName
        });
      }
      return uploadedPhotosResult;
    } catch (error) {
        console.error("Erreur pendant l'upload:", error);
        toast.error(`Erreur lors de l'upload des photos: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        throw error; // Rethrow pour que handleSave puisse le catcher
    } finally {
        setUploadingPhotos(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const results = [];
      for (let i = 0; i < equipementsList.length; i++) {
        const equipement = equipementsList[i];
        // Utiliser equipement.id pour le chemin si disponible, sinon un identifiant temporaire (index)
        // Pour la robustesse, il faudrait s'assurer que les nouveaux équipements obtiennent un ID avant l'upload de photos,
        // ou utiliser un ID temporaire unique généré côté client.
        // Pour l'instant, on va utiliser equipement.id || `new_${i}` comme placeholder pour le chemin.
        const equipementIdForPath = equipement.id || `new_equip_${i}`;

        const newlyUploadedPhotos = await _uploadPhotos(i, equipementIdForPath);

        const currentExistingPhotos = equipement.photos || [];
        const allPhotos = [...currentExistingPhotos, ...newlyUploadedPhotos];
        
        const dataToSave = {
          ...equipement,
          photos: allPhotos,
          etat_des_lieux_id: etatId, // Assurer que etatId est toujours là
        };

        if (equipement.id) { // Mise à jour
          results.push(updateAutreEquipementMutation.mutateAsync(dataToSave));
        } else { // Création
          results.push(createAutreEquipementMutation.mutateAsync(dataToSave));
        }
      }
      
      await Promise.all(results);
      setNewPhotos({}); // Vider les photos après upload réussi pour tous
      toast.success('Autres équipements sauvegardés avec succès !');
      refetch(); // Recharger les données pour avoir les IDs et URLs corrects
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error('Erreur lors de la sauvegarde des équipements.');
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoadingData) {
    return <Card><CardContent className="p-4">Chargement...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Autres équipements
          <Button onClick={addNewEquipement} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un équipement
          </Button>
        </CardTitle>
         <p className="text-sm text-gray-600">
          Listez ici tous les autres équipements non couverts par les sections spécifiques (ex: sonnette, boîte aux lettres, système d'alarme, etc.).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {equipementsList.map((equipement, index) => (
          <div key={equipement.id || `new-${index}`} className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg text-slate-700">Équipement #{index + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEquipement(index, equipement.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer cet équipement
              </Button>
            </div>
            
            <div>
              <Label htmlFor={`equipement_nom_${index}`} className="font-medium">Nom de l'équipement</Label>
              <Input
                id={`equipement_nom_${index}`}
                value={equipement.equipement || ''}
                onChange={(e) => handleInputChange(index, 'equipement', e.target.value)}
                placeholder="Ex: Sonnette, Boîte aux lettres, Détecteur de fumée..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`equipement_etat_entree_${index}`} className="font-medium">État à l'entrée</Label>
                <Input
                  id={`equipement_etat_entree_${index}`}
                  value={equipement.etat_entree || ''}
                  onChange={(e) => handleInputChange(index, 'etat_entree', e.target.value)}
                  placeholder="Ex: Neuf, Bon état, Usagé"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`equipement_etat_sortie_${index}`} className="font-medium">État à la sortie</Label>
                <Input
                  id={`equipement_etat_sortie_${index}`}
                  value={equipement.etat_sortie || ''}
                  onChange={(e) => handleInputChange(index, 'etat_sortie', e.target.value)}
                  placeholder="Ex: Neuf, Bon état, Usagé"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor={`equipement_commentaires_${index}`} className="font-medium">Commentaires</Label>
              <Input
                id={`equipement_commentaires_${index}`}
                value={equipement.commentaires || ''}
                onChange={(e) => handleInputChange(index, 'commentaires', e.target.value)}
                placeholder="Détails supplémentaires, observations..."
                className="mt-1"
              />
            </div>

            {/* Section Photos pour cet équipement */}
            <div className="space-y-3 pt-3 border-t mt-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-slate-600" />
                <h5 className="font-medium text-slate-700">Photos de l'équipement</h5>
                <Badge variant="outline">{ (equipement.photos?.length || 0) + (newPhotos[index]?.length || 0) } photo(s)</Badge>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={(el) => fileInputRefs.current[index] = el}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e, index)}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current[index]?.click()}
                  disabled={uploadingPhotos}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Ajouter des photos
                </Button>
                <p className="text-xs text-gray-500 mt-1">Max 5MB par image.</p>
              </div>

              {/* Photos existantes */}
              {equipement.photos && equipement.photos.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {equipement.photos.map((photo) => (
                      <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm">
                        <img src={photo.url} alt={photo.name} className="w-full h-28 object-cover" />
                        <div className="p-2 space-y-1">
                           <Input
                            type="text"
                            placeholder="Description..."
                            value={photo.description || ''}
                            onChange={(e) => handleExistingPhotoDescriptionChange(index, photo.id, e.target.value)}
                            className="text-xs h-7 w-full"
                          />
                          <div className="flex items-center justify-between mt-1">
                             <span className="text-xs text-gray-500 truncate" title={photo.name}>{(photo.size / (1024)).toFixed(1)} KB</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExistingPhoto(index, photo.id, photo.file_path)}
                              className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles photos */}
              {newPhotos[index] && newPhotos[index].length > 0 && (
                 <div className="space-y-2">
                  <h6 className="text-sm font-medium text-gray-600">Nouvelles photos (non sauvegardées) :</h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newPhotos[index].map((photoFile, photoIdx) => (
                      <div key={`new-${index}-${photoIdx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm">
                        <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                        <div className="p-2 space-y-1">
                           <Input
                            type="text"
                            placeholder="Description..."
                            value={photoFile.description || ''}
                            onChange={(e) => handleNewPhotoDescriptionChange(index, photoIdx, e.target.value)}
                            className="text-xs h-7 w-full"
                          />
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500 truncate" title={photoFile.name}>{(photoFile.size / (1024)).toFixed(1)} KB</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveNewPhoto(index, photoIdx)}
                              className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {equipementsList.length === 0 && (
          <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium">Aucun équipement pour le moment.</p>
            <p className="text-sm">Cliquez sur "Ajouter un équipement" pour commencer.</p>
          </div>
        )}

        {equipementsList.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || uploadingPhotos || createAutreEquipementMutation.isPending || updateAutreEquipementMutation.isPending}
              className="w-full md:w-auto"
              size="lg"
            >
              {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : 'Sauvegarder tous les équipements'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutresEquipementsStep;
