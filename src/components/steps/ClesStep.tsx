import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClesByEtatId, useCreateCle, useUpdateCle, useDeleteCle } from '@/hooks/useEtatDesLieux';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Trash2, Camera, X, Upload, Image as ImageIcon, KeyRound, AlertCircle } from 'lucide-react';
import type { StepRef } from '../EtatSortieForm';
import { useEmployes } from '@/context/EmployeContext';

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
        if (!response.ok) throw new Error(`Upload failed: ${response.statusText} (${response.status})`);
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
  category: string;
  file_path: string;
}

interface Cle {
  id?: string;
  etat_des_lieux_id: string;
  type_cle_badge: string;
  nombre: number;
  numero_cle: string;
  commentaires: string;
  photos: Photo[];
}

interface ClesStepProps {
  etatId: string;
}

const ClesStep = forwardRef<StepRef, ClesStepProps>(({ etatId }, ref) => {
  const { selectedEmployeId } = useEmployes();
  const { data: clesData, refetch, isLoading: isLoadingData } = useClesByEtatId(etatId);
  const createCleMutation = useCreateCle();
  const updateCleMutation = useUpdateCle();
  const deleteCleMutation = useDeleteCle();

  const [clesList, setClesList] = useState<Cle[]>([]);
  const [newPhotos, setNewPhotos] = useState<Record<number, (File & { description?: string })[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Exposer la fonction de sauvegarde via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveData: handleSave
  }));

  useEffect(() => {
    if (clesData) {
      setClesList(clesData.map(cle => ({ ...cle, photos: cle.photos || [] })));
    }
  }, [clesData]);

  const handleInputChange = (index: number, field: keyof Cle, value: string | number) => {
    setClesList(prev => prev.map((cle, i) =>
      i === index ? { ...cle, [field]: field === 'nombre' ? (Number(value) || 1) : value } : cle
    ));
  };

  const addNewCle = () => {
    setClesList(prev => [...prev, {
      etat_des_lieux_id: etatId,
      type_cle_badge: '',
      nombre: 1,
      numero_cle: '',
      commentaires: '',
      photos: [],
    }]);
  };

  const removeCle = async (index: number, cleId?: string) => {
    if (cleId) {
      try {
        await deleteCleMutation.mutateAsync(cleId);
        setAlertInfo({ type: 'success', message: 'Clé supprimée de la base de données.' });
      } catch (error) {
        console.error("Erreur suppression BDD:", error);
        setAlertInfo({ type: 'error', message: 'Erreur lors de la suppression de la clé en base de données.' });
        return;
      }
    }
    setClesList(prev => prev.filter((_, i) => i !== index));
    setNewPhotos(prev => {
      const updatedNewPhotosState = { ...prev };
      delete updatedNewPhotosState[index];
      // Re-index subsequent keys if necessary, though this can be complex
      // For now, this simple deletion is fine if order changes don't break other logic.
      return updatedNewPhotosState;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, cleIndex: number) => {
    const files = event.target.files;
    if (!files) return;
    const validFiles: (File & { description?: string })[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setAlertInfo({ type: 'error', message: `Fichier ${file.name} trop volumineux (max 5MB)` }); return;
      }
      if (!file.type.startsWith('image/')) {
        setAlertInfo({ type: 'error', message: `Fichier ${file.name} n'est pas une image` }); return;
      }
      const fileWithDesc = file as (File & { description?: string });
      fileWithDesc.description = '';
      validFiles.push(fileWithDesc);
    });
    setNewPhotos(prev => ({ ...prev, [cleIndex]: [...(prev[cleIndex] || []), ...validFiles] }));
  };

  const handleRemoveNewPhoto = (cleIndex: number, photoIndex: number) => {
    setNewPhotos(prev => {
      const clePhotos = [...(prev[cleIndex] || [])];
      clePhotos.splice(photoIndex, 1);
      return { ...prev, [cleIndex]: clePhotos };
    });
  };

  const handleNewPhotoDescriptionChange = (cleIndex: number, photoIndex: number, description: string) => {
    setNewPhotos(prev => {
      const clePhotos = [...(prev[cleIndex] || [])];
      if (clePhotos[photoIndex]) {
        clePhotos[photoIndex] = { ...clePhotos[photoIndex], description };
      }
      return { ...prev, [cleIndex]: clePhotos };
    });
  };

  const handleRemoveExistingPhoto = async (cleIndex: number, photoId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      if (storageError) {
        console.error("Erreur suppression storage:", storageError);
        throw storageError; // Throw to be caught by outer catch
      }
      setClesList(prev => prev.map((cle, i) => {
        if (i === cleIndex) {
          return { ...cle, photos: cle.photos.filter(p => p.id !== photoId) };
        }
        return cle;
      }));
      setAlertInfo({ type: 'success', message: 'Photo retirée localement. N\'oubliez pas de sauvegarder les modifications pour la supprimer définitivement.' });
    } catch (error) {
      console.error("Erreur handleRemoveExistingPhoto:", error);
      setAlertInfo({ type: 'error', message: `Erreur lors de la suppression de la photo: ${error instanceof Error ? error.message : 'Vérifiez la console'}` });
    }
  };

  const handleExistingPhotoDescriptionChange = (cleIndex: number, photoId: string, description: string) => {
    setClesList(prev => prev.map((cle, i) => {
      if (i === cleIndex) {
        return {
          ...cle, photos: cle.photos.map(p => p.id === photoId ? { ...p, description } : p)
        };
      }
      return cle;
    }));
  };

  const _uploadPhotos = async (cleIndex: number, cleIdForPath: string): Promise<Photo[]> => {
    const photosToUpload = newPhotos[cleIndex] || [];
    if (photosToUpload.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotosResult: Photo[] = [];
    try {
      for (const photoFile of photosToUpload) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/cles/${cleIdForPath}/${timestamp}_${randomId}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage.from('etat-des-lieux-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('etat-des-lieux-photos').getPublicUrl(uploadData!.path);
        uploadedPhotosResult.push({
          id: `${timestamp}_${randomId}`, name: photoFile.name, size: photoFile.size, type: photoFile.type,
          url: publicUrlData.publicUrl, description: photoFile.description || '',
          category: 'cles', file_path: uploadData!.path
        });
      }
      return uploadedPhotosResult;
    } catch (error) {
      console.error("Erreur _uploadPhotos:", error);
      setAlertInfo({ type: 'error', message: `Erreur lors de l'upload des photos: ${error instanceof Error ? error.message : 'Vérifiez la console'}` });
      throw error; // Re-throw to be caught by handleSave
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const results = [];
      for (let i = 0; i < clesList.length; i++) {
        const cle = clesList[i];
        // Use a more robust unique ID for path if cle.id is not available yet
        const cleIdForPath = cle.id || `new_cle_${Date.now()}_${i}`;
        
        const newlyUploadedPhotos = await _uploadPhotos(i, cleIdForPath);

        const currentExistingPhotos = cle.photos || [];
        const allPhotos = [...currentExistingPhotos, ...newlyUploadedPhotos];

        const dataToSave: Cle = {
          ...cle,
          photos: allPhotos,
          etat_des_lieux_id: etatId,
          nombre: Number(cle.nombre) || 1, // Ensure 'nombre' is a number
          // @ts-ignore
          employe_id: selectedEmployeId ?? null,
        };

        if (cle.id) { // Update existing cle
          results.push(updateCleMutation.mutateAsync(dataToSave));
        } else { // Create new cle
          // If backend generates ID, don't send client-generated 'id' placeholder
          const { id, ...creationData } = dataToSave;
          results.push(createCleMutation.mutateAsync(creationData as Omit<Cle, 'id'> & { etat_des_lieux_id: string }));
        }
      }
      await Promise.all(results);
      setNewPhotos({}); // Clear new photos queue for all items
      setAlertInfo({ type: 'success', message: 'Clés et badges sauvegardés avec succès !' });
      refetch(); // Refetch data to get latest state including new IDs and photo URLs
    } catch (error) {
      console.error("Erreur handleSave:", error);
      setAlertInfo({ type: 'error', message: `Erreur lors de la sauvegarde des clés/badges: ${error instanceof Error ? error.message : 'Vérifiez la console'}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) return <Card><CardContent className="p-6 text-center">Chargement des clés et badges...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-amber-600" />
            Remise des clés et badges
          </div>
          <Button onClick={addNewCle} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une clé/badge
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Inventoriez chaque clé et badge remis. Précisez le type, la quantité, et toute référence utile. Assurez-vous de prendre des photos claires pour chaque élément.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {alertInfo && (
          <Alert variant={alertInfo.type === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{alertInfo.type === 'error' ? 'Erreur' : 'Succès'}</AlertTitle>
            <AlertDescription>
              {alertInfo.message}
            </AlertDescription>
          </Alert>
        )}
        {clesList.map((cle, index) => (
          <div key={cle.id || `new-cle-${index}`} className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg text-slate-700">Clé/Badge #{index + 1}</h4>
              <Button variant="ghost" size="sm" onClick={() => removeCle(index, cle.id)} className="text-red-500 hover:text-red-700" disabled={isSaving || uploadingPhotos}>
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`type_cle_badge_${index}`} className="font-medium text-sm">Type</Label>
                <Input id={`type_cle_badge_${index}`} value={cle.type_cle_badge || ''} onChange={(e) => handleInputChange(index, 'type_cle_badge', e.target.value)} placeholder="Ex: Clé appartement, Badge Vigik" className="mt-1"/>
              </div>
              <div>
                <Label htmlFor={`nombre_${index}`} className="font-medium text-sm">Nombre</Label>
                <Input id={`nombre_${index}`} type="number" value={cle.nombre || 1} onChange={(e) => handleInputChange(index, 'nombre', parseInt(e.target.value) || 1)} min="1" className="mt-1"/>
              </div>
              <div>
                <Label htmlFor={`numero_cle_${index}`} className="font-medium text-sm">Numéro/Référence</Label>
                <Input id={`numero_cle_${index}`} value={cle.numero_cle || ''} onChange={(e) => handleInputChange(index, 'numero_cle', e.target.value)} placeholder="Ex: N°123, Pass PTT" className="mt-1"/>
              </div>
            </div>
            
            <div>
              <Label htmlFor={`commentaires_${index}`} className="font-medium text-sm">Commentaires</Label>
              <Input id={`commentaires_${index}`} value={cle.commentaires || ''} onChange={(e) => handleInputChange(index, 'commentaires', e.target.value)} placeholder="Observations (usure, particularité...)" className="mt-1"/>
            </div>

            {/* Section Photos */}
            <div className="space-y-3 pt-3 border-t mt-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-slate-600" />
                <h5 className="font-medium text-slate-700">Photos de la clé/badge</h5>
                <Badge variant="secondary">{ (cle.photos?.length || 0) + (newPhotos[index]?.length || 0) } photo(s)</Badge>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={() => fileInputRefs.current[index]?.click()}>
                <input ref={(el) => fileInputRefs.current[index] = el} type="file" multiple accept="image/*" onChange={(e) => handleFileSelect(e, index)} className="hidden" disabled={uploadingPhotos || isSaving}/>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRefs.current[index]?.click();}} disabled={uploadingPhotos || isSaving}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Ajouter des photos
                </Button>
                <p className="text-xs text-gray-500 mt-1">Max 5MB par image. JPG, PNG, WebP.</p>
              </div>

              {/* Photos existantes */}
              {cle.photos && cle.photos.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {cle.photos.map((photo) => (
                      <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                        <img src={photo.url} alt={photo.name || 'Photo de clé'} className="w-full h-28 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Image+introuvable')} />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveExistingPhoto(index, photo.id, photo.file_path)} className="h-6 w-6 p-0" disabled={isSaving || uploadingPhotos}>
                              <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="p-2 space-y-1">
                          <Input type="text" placeholder="Description..." value={photo.description || ''} onChange={(e) => handleExistingPhotoDescriptionChange(index, photo.id, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving || uploadingPhotos}/>
                          <p className="text-xs text-gray-500 truncate" title={photo.name}>{(photo.size / 1024).toFixed(1)} KB <span className="text-green-600">✓</span></p>
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
                      <div key={`new-cle-${index}-photo-${photoIdx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                        <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveNewPhoto(index, photoIdx)} className="h-6 w-6 p-0" disabled={isSaving || uploadingPhotos}>
                              <X className="h-3 w-3" />
                            </Button>
                        </div>
                         <div className="p-2 space-y-1">
                          <Input type="text" placeholder="Description..." value={photoFile.description || ''} onChange={(e) => handleNewPhotoDescriptionChange(index, photoIdx, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving || uploadingPhotos}/>
                           <p className="text-xs text-gray-500 truncate" title={photoFile.name}>{(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {clesList.length === 0 && (
          <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg bg-slate-50">
            <KeyRound className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="font-medium text-slate-700">Aucune clé ou badge n'a été ajouté pour le moment.</p>
            <p className="text-sm text-slate-500">Cliquez sur "Ajouter une clé/badge" pour commencer à inventorier.</p>
          </div>
        )}

        {clesList.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || uploadingPhotos || createCleMutation.isPending || updateCleMutation.isPending || deleteCleMutation.isPending}
              className="w-full md:w-auto"
              size="lg"
            >
              {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : (createCleMutation.isPending || updateCleMutation.isPending ? 'Traitement...' : 'Sauvegarder les clés et badges')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ClesStep.displayName = 'ClesStep';

export default ClesStep;
