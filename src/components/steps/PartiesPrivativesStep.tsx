
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePartiesPrivativesByEtatId, useCreatePartiePrivative, useUpdatePartiePrivative, useDeletePartiePrivative } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, X, Upload, Image as ImageIcon, Building2 } from 'lucide-react';
import type { StepRef } from '../EtatSortieForm';

// Configuration Supabase (simulée)
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
  category: string; // 'parties_privatives'
  file_path: string;
}

interface PartiePrivative {
  id?: string;
  etat_des_lieux_id: string;
  type_partie: string; // Ex: Cave, Parking, Garage, Jardin, Balcon, Terrasse
  etat_entree?: string; // Ajouté pour parité avec sortie, si applicable
  etat_sortie: string;
  numero: string; // Numéro de lot, de place, etc.
  commentaires: string;
  photos: Photo[];
}

interface PartiesPrivativesStepProps {
  etatId: string;
}

const PartiesPrivativesStep = forwardRef<StepRef, PartiesPrivativesStepProps>(({ etatId }, ref) => {
  const { data: partiesPrivativesData, refetch, isLoading: isLoadingData } = usePartiesPrivativesByEtatId(etatId);
  const createPartiePrivativeMutation = useCreatePartiePrivative();
  const updatePartiePrivativeMutation = useUpdatePartiePrivative();
  const deletePartiePrivativeMutation = useDeletePartiePrivative();

  const [partiesList, setPartiesList] = useState<PartiePrivative[]>([]);
  const [newPhotos, setNewPhotos] = useState<Record<number, (File & { description?: string })[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Exposer la fonction de sauvegarde via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveData: handleSave
  }));

  useEffect(() => {
    if (partiesPrivativesData) {
      setPartiesList(partiesPrivativesData.map(p => ({ ...p, photos: p.photos || [] })));
    }
  }, [partiesPrivativesData]);

  const handleInputChange = (index: number, field: keyof PartiePrivative, value: string) => {
    setPartiesList(prev => prev.map((partie, i) =>
      i === index ? { ...partie, [field]: value } : partie
    ));
  };

  const addNewPartie = () => {
    setPartiesList(prev => [...prev, {
      etat_des_lieux_id: etatId,
      type_partie: '',
      etat_entree: '', // Initialiser si pertinent
      etat_sortie: '',
      numero: '',
      commentaires: '',
      photos: [],
    }]);
  };

  const removePartie = async (index: number, partieId?: string) => {
    if (partieId) {
      try {
        await deletePartiePrivativeMutation.mutateAsync(partieId);
        toast.success('Partie privative supprimée de la base de données.');
      } catch (error) {
        toast.error('Erreur lors de la suppression de la partie privative.');
        return;
      }
    }
    setPartiesList(prev => prev.filter((_, i) => i !== index));
    setNewPhotos(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, partieIndex: number) => {
    const files = event.target.files;
    if (!files) return;
    const validFiles: (File & { description?: string })[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`Fichier ${file.name} trop volumineux (max 5MB)`); return; }
      if (!file.type.startsWith('image/')) { toast.error(`Fichier ${file.name} n'est pas une image`); return; }
      const fileWithDesc = file as (File & { description?: string });
      fileWithDesc.description = '';
      validFiles.push(fileWithDesc);
    });
    setNewPhotos(prev => ({ ...prev, [partieIndex]: [...(prev[partieIndex] || []), ...validFiles] }));
  };

  const handleRemoveNewPhoto = (partieIndex: number, photoIndex: number) => {
    setNewPhotos(prev => {
      const partiePhotos = [...(prev[partieIndex] || [])];
      partiePhotos.splice(photoIndex, 1);
      return { ...prev, [partieIndex]: partiePhotos };
    });
  };

  const handleNewPhotoDescriptionChange = (partieIndex: number, photoIndex: number, description: string) => {
    setNewPhotos(prev => {
      const partiePhotos = [...(prev[partieIndex] || [])];
      if (partiePhotos[photoIndex]) {
        partiePhotos[photoIndex] = { ...partiePhotos[photoIndex], description };
      }
      return { ...prev, [partieIndex]: partiePhotos };
    });
  };

  const handleRemoveExistingPhoto = async (partieIndex: number, photoId: string, filePath: string) => {
    try {
      await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      setPartiesList(prev => prev.map((partie, i) => i === partieIndex ? { ...partie, photos: partie.photos.filter(p => p.id !== photoId) } : partie));
      toast.info('Photo retirée. Sauvegardez pour confirmer.');
    } catch (error) { toast.error('Erreur suppression photo stockage.'); }
  };

  const handleExistingPhotoDescriptionChange = (partieIndex: number, photoId: string, description: string) => {
    setPartiesList(prev => prev.map((partie, i) => i === partieIndex ? {
      ...partie, photos: partie.photos.map(p => p.id === photoId ? { ...p, description } : p)
    } : partie));
  };

  const _uploadPhotos = async (partieIndex: number, partieIdForPath: string): Promise<Photo[]> => {
    const photosToUpload = newPhotos[partieIndex] || [];
    if (photosToUpload.length === 0) return [];
    setUploadingPhotos(true);
    const uploadedResults: Photo[] = [];
    try {
      for (const photoFile of photosToUpload) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/parties_privatives/${partieIdForPath}/${timestamp}_${randomId}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('etat-des-lieux-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('etat-des-lieux-photos').getPublicUrl(uploadData!.path);
        uploadedResults.push({
          id: `${timestamp}_${randomId}`, name: photoFile.name, size: photoFile.size, type: photoFile.type,
          url: publicUrlData.publicUrl, description: photoFile.description || '',
          category: 'parties_privatives', file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      toast.error(`Erreur upload photos: ${error instanceof Error ? error.message : 'Inconnue'}`);
      throw error;
    } finally { setUploadingPhotos(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const results = [];
      for (let i = 0; i < partiesList.length; i++) {
        const partie = partiesList[i];
        const partieIdForPath = partie.id || `new_partie_${Date.now()}_${i}`;
        const newlyUploadedPhotos = await _uploadPhotos(i, partieIdForPath);
        const allPhotos = [...(partie.photos || []), ...newlyUploadedPhotos];
        const dataToSave = { ...partie, photos: allPhotos, etat_des_lieux_id: etatId };

        if (partie.id) {
          results.push(updatePartiePrivativeMutation.mutateAsync(dataToSave));
        } else {
          const { id, ...creationData } = dataToSave;
          results.push(createPartiePrivativeMutation.mutateAsync(creationData as Omit<PartiePrivative, 'id'>));
        }
      }
      await Promise.all(results);
      setNewPhotos({});
      toast.success('Parties privatives sauvegardées !');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des parties privatives.');
    } finally { setIsSaving(false); }
  };

  if (isLoadingData) return <Card><CardContent className="p-6 text-center">Chargement des parties privatives...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Parties privatives annexes
          </div>
          <Button onClick={addNewPartie} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une partie
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Listez ici les caves, parkings, garages, jardins, balcons, terrasses et autres dépendances privatives.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {partiesList.map((partie, index) => (
          <div key={partie.id || `new-${index}`} className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg text-slate-700">Partie privative #{index + 1}</h4>
              <Button variant="ghost" size="sm" onClick={() => removePartie(index, partie.id)} className="text-red-500 hover:text-red-700" disabled={isSaving || uploadingPhotos}>
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`type_partie_${index}`} className="font-medium">Type de partie</Label>
                <Input id={`type_partie_${index}`} value={partie.type_partie || ''} onChange={(e) => handleInputChange(index, 'type_partie', e.target.value)} placeholder="Ex: Cave, Parking, Jardin" className="mt-1"/>
              </div>
              <div>
                <Label htmlFor={`numero_${index}`} className="font-medium">Numéro/Identification</Label>
                <Input id={`numero_${index}`} value={partie.numero || ''} onChange={(e) => handleInputChange(index, 'numero', e.target.value)} placeholder="Ex: N°12, Lot B, Box A3" className="mt-1"/>
              </div>
            </div>
            
            <div>
              <Label htmlFor={`etat_entree_${index}`} className="font-medium">État à l'entrée (si applicable)</Label>
              <Input id={`etat_entree_${index}`} value={partie.etat_entree || ''} onChange={(e) => handleInputChange(index, 'etat_entree', e.target.value)} placeholder="Décrire l'état initial" className="mt-1"/>
            </div>

            <div>
              <Label htmlFor={`etat_sortie_${index}`} className="font-medium">État à la sortie</Label>
              <Input id={`etat_sortie_${index}`} value={partie.etat_sortie || ''} onChange={(e) => handleInputChange(index, 'etat_sortie', e.target.value)} placeholder="Décrire l'état final" className="mt-1"/>
            </div>
            
            <div>
              <Label htmlFor={`commentaires_${index}`} className="font-medium">Commentaires</Label>
              <Input id={`commentaires_${index}`} value={partie.commentaires || ''} onChange={(e) => handleInputChange(index, 'commentaires', e.target.value)} placeholder="Observations spécifiques" className="mt-1"/>
            </div>

            {/* Section Photos */}
            <div className="space-y-3 pt-3 border-t mt-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-slate-600" />
                <h5 className="font-medium text-slate-700">Photos de la partie privative</h5>
                <Badge variant="secondary">{ (partie.photos?.length || 0) + (newPhotos[index]?.length || 0) } photo(s)</Badge>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={() => !isSaving && fileInputRefs.current[index]?.click()}>
                <input ref={(el) => fileInputRefs.current[index] = el} type="file" multiple accept="image/*" onChange={(e) => handleFileSelect(e, index)} className="hidden" disabled={isSaving || uploadingPhotos}/>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Button type="button" variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); !isSaving && fileInputRefs.current[index]?.click();}} disabled={isSaving || uploadingPhotos}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Ajouter photos
                </Button>
                <p className="text-xs text-gray-500 mt-1">Max 5MB/image.</p>
              </div>

              {partie.photos && partie.photos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h6 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {partie.photos.map((photo) => (
                      <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                        <img src={photo.url} alt={photo.name || 'Photo partie privative'} className="w-full h-28 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveExistingPhoto(index, photo.id, photo.file_path)} className="h-6 w-6 p-0" disabled={isSaving || uploadingPhotos}><X className="h-3 w-3" /></Button>
                        </div>
                        <div className="p-2">
                          <Input type="text" placeholder="Description" value={photo.description || ''} onChange={(e) => handleExistingPhotoDescriptionChange(index, photo.id, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving || uploadingPhotos}/>
                          <p className="text-xs text-gray-500 truncate mt-1" title={photo.name}>{(photo.size / 1024).toFixed(1)} KB <span className="text-green-600">✓</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newPhotos[index] && newPhotos[index].length > 0 && (
                 <div className="mt-4 space-y-2">
                  <h6 className="text-sm font-medium text-gray-600">Nouvelles photos :</h6>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newPhotos[index].map((photoFile, photoIdx) => (
                      <div key={`new-partie-${index}-photo-${photoIdx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                        <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveNewPhoto(index, photoIdx)} className="h-6 w-6 p-0" disabled={isSaving || uploadingPhotos}><X className="h-3 w-3" /></Button>
                        </div>
                        <div className="p-2">
                          <Input type="text" placeholder="Description" value={photoFile.description || ''} onChange={(e) => handleNewPhotoDescriptionChange(index, photoIdx, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving || uploadingPhotos}/>
                           <p className="text-xs text-gray-500 truncate mt-1" title={photoFile.name}>{(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {partiesList.length === 0 && (
          <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg bg-slate-50">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="font-medium text-slate-700">Aucune partie privative n'a été ajoutée.</p>
            <p className="text-sm text-slate-500">Cliquez sur "Ajouter une partie" pour commencer.</p>
          </div>
        )}

        {partiesList.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || uploadingPhotos || createPartiePrivativeMutation.isPending || updatePartiePrivativeMutation.isPending || deletePartiePrivativeMutation.isPending}
              className="w-full md:w-auto"
              size="lg"
            >
              {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : 'Sauvegarder les parties privatives'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PartiesPrivativesStep.displayName = 'PartiesPrivativesStep';

export default PartiesPrivativesStep;
