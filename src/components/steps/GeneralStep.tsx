import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEtatDesLieuxById, useUpdateEtatDesLieux, useRendezVousById } from '@/hooks/useEtatDesLieux';
import { Camera, X, Upload, Image as ImageIcon, Info, FileText } from 'lucide-react';

// Configuration Supabase (simulée)
const SUPABASE_URL = 'https://osqpvyrctlhagtzkbspv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXB2eXJjdGxoYWd0emtic3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg1NjYsImV4cCI6MjA2NjYwNDU2Nn0.4APWILaWXOtXCwdFYTk4MDithvZhp55ZJB6PnVn8D1w';

const supabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        const formDataBody = new FormData();
        formDataBody.append('file', file);
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: formDataBody
        });
        if (!response.ok) throw new Error(`Upload failed: ${response.statusText} (${response.status})`);
        const result = await response.json();
        // Supabase storage upload response for a single file doesn't directly return a path in the body like that.
        // It returns { Key: 'bucket/path/to/file.png' } or similar depending on version/config.
        // For simplicity, we'll assume the path used for upload is the one to return.
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

interface EtatDesLieuxFormData {
  adresse_bien: string;
  type_etat_des_lieux: 'entree' | 'sortie';
  type_bien: 'studio' | 't2_t3' | 't4_t5' | 'inventaire_mobilier' | 'bureau' | 'local_commercial' | 'garage_box' | 'pieces_supplementaires';
  bailleur_nom: string;
  bailleur_adresse: string;
  locataire_nom: string;
  locataire_adresse: string;
  date_entree: string;
  date_sortie: string;
  statut: string;
}

interface GeneralStepProps {
  etatId: string;
}

const GeneralStep: React.FC<GeneralStepProps> = ({ etatId }) => {
  const { data: etatDesLieuxInitial, isLoading, refetch } = useEtatDesLieuxById(etatId);
  const { data: rendezVousData } = useRendezVousById(etatDesLieuxInitial?.rendez_vous_id || null);
  const { mutate: updateEtatDesLieux, isPending: isUpdatingMutation } = useUpdateEtatDesLieux();

  const [formData, setFormData] = useState<EtatDesLieuxFormData>({
    adresse_bien: '', type_etat_des_lieux: 'entree', type_bien: 'studio',
    bailleur_nom: '', bailleur_adresse: '', locataire_nom: '', locataire_adresse: '',
    date_entree: '', date_sortie: '', statut: '',
  });

  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [isSaving, setIsSaving] = useState(false); // Combined state for saving and photo uploading phase
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeEtatDesLieuxOptions = [
    { value: 'entree', label: 'Entrée' }, { value: 'sortie', label: 'Sortie' }
  ];
  const typeBienOptions = [
    { value: 'studio', label: 'Studio' }, { value: 't2_t3', label: 'T2/T3' },
    { value: 't4_t5', label: 'T4/T5' }, { value: 'inventaire_mobilier', label: 'Inventaire mobilier' },
    { value: 'bureau', label: 'Bureau' }, { value: 'local_commercial', label: 'Local commercial' },
    { value: 'garage_box', label: 'Garage/Box' }, { value: 'pieces_supplementaires', label: 'Pièces supplémentaires' }
  ];
  const statutOptions = [
    { value: 'en_cours', label: 'En cours' }, { value: 'termine', label: 'Terminé' },
    { value: 'brouillon', label: 'Brouillon' }, { value: 'valide', label: 'Validé' }
  ];

  useEffect(() => {
    if (etatDesLieuxInitial) {
      const { photos, id, rendez_vous_id, ...restData } = etatDesLieuxInitial;
      setFormData({
        ...restData,
        date_entree: restData.date_entree ? new Date(restData.date_entree).toISOString().split('T')[0] : '',
        date_sortie: restData.date_sortie ? new Date(restData.date_sortie).toISOString().split('T')[0] : '',
      });
      setExistingPhotos(photos || []);
    }
  }, [etatDesLieuxInitial]);

  useEffect(() => {
    if (rendezVousData) {
      setFormData(prev => ({
        ...prev,
        type_etat_des_lieux: prev.type_etat_des_lieux || rendezVousData.type_etat_des_lieux || '',
        type_bien: prev.type_bien || rendezVousData.type_bien || '',
        adresse_bien: prev.adresse_bien || rendezVousData.adresse || '',
      }));
    }
  }, [rendezVousData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof EtatDesLieuxFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const validFiles: (File & { description?: string })[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`Fichier ${file.name} trop volumineux (max 5MB)`); return; }
      // Allow images and common document types
      if (!file.type.startsWith('image/') && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error(`Type de fichier ${file.name} non supporté.`); return;
      }
      const fileWithDesc = file as (File & { description?: string });
      fileWithDesc.description = '';
      validFiles.push(fileWithDesc);
    });
    setNewPhotos(prev => [...prev, ...validFiles]);
  };

  const handleRemoveNewPhoto = (photoIndex: number) => {
    setNewPhotos(prev => prev.filter((_, index) => index !== photoIndex));
  };

  const handleNewPhotoDescriptionChange = (photoIndex: number, description: string) => {
    setNewPhotos(prev => prev.map((photo, i) => i === photoIndex ? { ...photo, description } : photo));
  };

  const handleRemoveExistingPhoto = async (photoId: string, filePath: string) => {
    setIsSaving(true);
    try {
      await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.info('Photo retirée. Sauvegardez les informations générales pour confirmer la suppression.');
      // Trigger a save of the main form data to persist the change in the photos array
      // This requires handleSave to be robust enough or a separate mechanism.
      // For now, we assume the main save button will finalize this.
    } catch (error) {
      toast.error('Erreur lors de la suppression du fichier de stockage.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExistingPhotoDescriptionChange = (photoId: string, description: string) => {
    setExistingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
  };

  const _uploadPhotos = async (): Promise<Photo[]> => {
    if (newPhotos.length === 0) return [];

    const uploadedResults: Photo[] = [];
    try {
      for (const photoFile of newPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/general/${timestamp}_${randomId}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage.from('etat-des-lieux-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('etat-des-lieux-photos').getPublicUrl(uploadData!.path);
        uploadedResults.push({
          id: `${timestamp}_${randomId}`, name: photoFile.name, size: photoFile.size, type: photoFile.type,
          url: publicUrlData.publicUrl, description: photoFile.description || '',
          category: 'general_etat_des_lieux', file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      console.error("Erreur _uploadPhotos:", error);
      toast.error(`Erreur lors de l'upload des photos: ${error instanceof Error ? error.message : 'Vérifiez la console'}`);
      throw error; // Re-throw to be caught by handleSave
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let newStatut = formData.statut;
      if (etatDesLieuxInitial?.date_sortie && !formData.date_sortie) newStatut = 'en_cours';
      else if (formData.date_sortie && formData.statut !== 'finalise' && newStatut === 'en_cours') newStatut = 'finalise';

      const uploadedPhotosData = await _uploadPhotos();
      const allPhotos = [...existingPhotos, ...uploadedPhotosData];

      const validatedData = {
        id: etatId,
        ...formData,
        date_entree: formData.date_entree || null,
        date_sortie: formData.date_sortie || null,
        statut: newStatut,
        photos: allPhotos,
      };

      updateEtatDesLieux(validatedData, {
        onSuccess: () => {
          toast.success('Informations générales sauvegardées avec succès !');
          setNewPhotos([]);
          refetch();
        },
        onError: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          toast.error('Erreur lors de la sauvegarde des informations générales.');
        }
      });
    } catch (error) {
        toast.error(`Erreur lors du processus de sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mr-3"></div>
            Chargement des informations générales...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-sky-600" />
            Informations Générales de l'État des Lieux
        </CardTitle>
        {rendezVousData && (
          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-md mt-2 border border-blue-200">
            Certaines informations ont été pré-remplies depuis le rendez-vous du {new Date(rendezVousData.date).toLocaleDateString('fr-FR')}.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Sections de formulaire existantes */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Bien immobilier</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adresse_bien" className="font-medium">Adresse du bien *</Label>
              <Input id="adresse_bien" value={formData.adresse_bien} onChange={handleInputChange} placeholder="Adresse complète du bien" className="mt-1"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type_etat_des_lieux" className="font-medium">Type d'état des lieux *</Label>
                <Select value={formData.type_etat_des_lieux} onValueChange={(value) => handleSelectChange('type_etat_des_lieux', value)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                  <SelectContent>{typeEtatDesLieuxOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type_bien" className="font-medium">Type de bien *</Label>
                <Select value={formData.type_bien} onValueChange={(value) => handleSelectChange('type_bien', value)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                  <SelectContent>{typeBienOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Dates Clés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_entree" className="font-medium">Date d'entrée dans les lieux</Label>
              <Input id="date_entree" type="date" value={formData.date_entree} onChange={handleInputChange} className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="date_sortie" className="font-medium">Date de sortie des lieux</Label>
              <Input id="date_sortie" type="date" value={formData.date_sortie} onChange={handleInputChange} className="mt-1"/>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Bailleur / Propriétaire</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bailleur_nom" className="font-medium">Nom du bailleur (ou représentant)</Label>
              <Input id="bailleur_nom" value={formData.bailleur_nom} onChange={handleInputChange} placeholder="Nom complet" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="bailleur_adresse" className="font-medium">Adresse du bailleur</Label>
              <Input id="bailleur_adresse" value={formData.bailleur_adresse} onChange={handleInputChange} placeholder="Adresse complète" className="mt-1"/>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Locataire(s)</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="locataire_nom" className="font-medium">Nom du/des locataire(s)</Label>
              <Input id="locataire_nom" value={formData.locataire_nom} onChange={handleInputChange} placeholder="Nom(s) complet(s)" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="locataire_adresse" className="font-medium">Adresse du/des locataire(s) (si différente)</Label>
              <Input id="locataire_adresse" value={formData.locataire_adresse} onChange={handleInputChange} placeholder="Adresse complète" className="mt-1"/>
            </div>
          </div>
        </div>

        {/* Section Photos Générales */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Camera className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-700">Photos générales / Documents</h3>
                <Badge variant="secondary">{existingPhotos.length + newPhotos.length} photo(s)/doc(s)</Badge>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={() => !isSaving && fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" disabled={isSaving}/>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Button type="button" variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); !isSaving && fileInputRef.current?.click();}} disabled={isSaving}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Ajouter photos/documents
                </Button>
                <p className="text-xs text-gray-500 mt-1">Façade, documents annexes, etc. (Images, PDF, Word)</p>
            </div>

            {existingPhotos.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Photos/Documents sauvegardé(e)s :</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingPhotos.map((photo) => (
                            <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                                {photo.type.startsWith('image/') ? (
                                    <img src={photo.url} alt={photo.name || 'Photo générale'} className="w-full h-28 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} />
                                ) : (
                                    <div className="w-full h-28 flex flex-col items-center justify-center bg-gray-100 p-2">
                                        <FileText className="h-10 w-10 text-gray-400" />
                                        <p className="text-xs text-gray-600 mt-1 truncate w-full text-center" title={photo.name}>{photo.name}</p>
                                    </div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)} className="h-6 w-6 p-0" disabled={isSaving}><X className="h-3 w-3" /></Button>
                                </div>
                                <div className="p-2">
                                    <Input type="text" placeholder="Description" value={photo.description || ''} onChange={(e) => handleExistingPhotoDescriptionChange(photo.id, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving}/>
                                    <p className="text-xs text-gray-500 truncate mt-1">{(photo.size / 1024).toFixed(1)} KB <span className="text-green-600">✓</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {newPhotos.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Nouveaux photos/documents :</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {newPhotos.map((photoFile, idx) => (
                            <div key={`new-general-${idx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                                {photoFile.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                                ) : (
                                     <div className="w-full h-28 flex flex-col items-center justify-center bg-gray-100 p-2">
                                        <FileText className="h-10 w-10 text-gray-400" />
                                        <p className="text-xs text-gray-600 mt-1 truncate w-full text-center" title={photoFile.name}>{photoFile.name}</p>
                                    </div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveNewPhoto(idx)} className="h-6 w-6 p-0" disabled={isSaving}><X className="h-3 w-3" /></Button>
                                </div>
                                <div className="p-2">
                                    <Input type="text" placeholder="Description" value={photoFile.description || ''} onChange={(e) => handleNewPhotoDescriptionChange(idx, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving}/>
                                    <p className="text-xs text-gray-500 truncate mt-1">{(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Statut de l'État des Lieux</h3>
          <div>
            <Label htmlFor="statut" className="font-medium">Statut actuel</Label>
            <Select value={formData.statut} onValueChange={(value) => handleSelectChange('statut', value)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner le statut" /></SelectTrigger>
              <SelectContent>{statutOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isUpdatingMutation}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSaving || isUpdatingMutation ? 'Enregistrement...' : 'Sauvegarder les informations générales'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralStep;
