import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEtatDesLieuxById, useUpdateEtatDesLieux, useRendezVousById } from '@/hooks/useEtatDesLieux';
import { Camera, X, Upload, Image as ImageIcon, Info, FileText, AlertCircle } from 'lucide-react';
import type { StepRef } from '../EtatSortieForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEmployes } from '@/context/EmployeContext';

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
          headers: { 
            'apikey': SUPABASE_ANON_KEY, 
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
          },
          body: formDataBody
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText} (${response.status})`);
        }
        
        const result = await response.json();
        return { data: { path }, error: null };
      },
      
      remove: async (paths: string[]) => {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: { 
            'apikey': SUPABASE_ANON_KEY, 
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
            'Content-Type': 'application/json' 
          },
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

const GeneralStep = forwardRef<StepRef, GeneralStepProps>(({ etatId }, ref) => {
  const { selectedEmployeId } = useEmployes();
  const { data: etatDesLieuxInitial, isLoading, refetch } = useEtatDesLieuxById(etatId, '');
  const { data: rendezVousData } = useRendezVousById(etatDesLieuxInitial?.rendez_vous_id || null);
  const { mutate: updateEtatDesLieux, isPending: isUpdatingMutation } = useUpdateEtatDesLieux();

  const [formData, setFormData] = useState<EtatDesLieuxFormData>({
    adresse_bien: '',
    type_etat_des_lieux: 'entree',
    type_bien: 'studio',
    bailleur_nom: '',
    bailleur_adresse: '',
    locataire_nom: '',
    locataire_adresse: '',
    date_entree: '',
    date_sortie: '',
    statut: '',
  });

  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  
  // Exposer la fonction de sauvegarde via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveData: handleSave
  }));

  const typeEtatDesLieuxOptions = [
    { value: 'entree', label: 'Entrée' },
    { value: 'sortie', label: 'Sortie' }
  ];

  const typeBienOptions = [
    { value: 'studio', label: 'Studio' },
    { value: 't2_t3', label: 'T2/T3' },
    { value: 't4_t5', label: 'T4/T5' },
    { value: 'inventaire_mobilier', label: 'Inventaire mobilier' },
    { value: 'bureau', label: 'Bureau' },
    { value: 'local_commercial', label: 'Local commercial' },
    { value: 'garage_box', label: 'Garage/Box' },
    { value: 'pieces_supplementaires', label: 'Pièces supplémentaires' }
  ];

  const statutOptions = [
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'valide', label: 'Validé' }
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
        type_etat_des_lieux: prev.type_etat_des_lieux || rendezVousData.type_etat_des_lieux || 'entree',
        type_bien: prev.type_bien || rendezVousData.type_bien || 'studio',
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
      if (file.size > 5 * 1024 * 1024) {
        setAlertInfo({ type: 'error', message: `Fichier ${file.name} trop volumineux (max 5MB)` });
        return;
      }
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!file.type.startsWith('image/') && !allowedTypes.includes(file.type)) {
        setAlertInfo({ type: 'error', message: `Type de fichier ${file.name} non supporté.` });
        return;
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
    setNewPhotos(prev => prev.map((photo, i) => 
      i === photoIndex ? { ...photo, description } : photo
    ));
  };

  const handleRemoveExistingPhoto = async (photoId: string, filePath: string) => {
    setIsSaving(true);
    try {
      await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      setAlertInfo({ type: 'info', message: 'Photo retirée. Sauvegardez les informations générales pour confirmer la suppression.' });
    } catch (error) {
      setAlertInfo({ type: 'error', message: 'Erreur lors de la suppression du fichier de stockage.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExistingPhotoDescriptionChange = (photoId: string, description: string) => {
    setExistingPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, description } : p
    ));
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

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('etat-des-lieux-photos')
          .upload(fileName, photoFile);
          
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('etat-des-lieux-photos')
          .getPublicUrl(uploadData!.path);
          
        uploadedResults.push({
          id: `${timestamp}_${randomId}`,
          name: photoFile.name,
          size: photoFile.size,
          type: photoFile.type,
          url: publicUrlData.publicUrl,
          description: photoFile.description || '',
          category: 'general_etat_des_lieux',
          file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      console.error("Erreur _uploadPhotos:", error);
      setAlertInfo({ type: 'error', message: `Erreur lors de l'upload des photos: ${error instanceof Error ? error.message : 'Vérifiez la console'}` });
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let newStatut = formData.statut;
      if (etatDesLieuxInitial?.date_sortie && !formData.date_sortie) {
        newStatut = 'en_cours';
      } else if (formData.date_sortie && formData.statut !== 'finalise' && newStatut === 'en_cours') {
        newStatut = 'finalise';
      }

      const uploadedPhotosData = await _uploadPhotos();
      const allPhotos = [...existingPhotos, ...uploadedPhotosData];

      const validatedData = {
        id: etatId,
        ...formData,
        date_entree: formData.date_entree || null,
        date_sortie: formData.date_sortie || null,
        statut: newStatut,
        photos: allPhotos,
        employe_id: selectedEmployeId ?? null,
      };

      updateEtatDesLieux(validatedData, {
        onSuccess: () => {
          setAlertInfo({ type: 'success', message: 'Informations générales sauvegardées avec succès !' });
          setNewPhotos([]);
          refetch();
        },
        onError: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          setAlertInfo({ type: 'error', message: 'Erreur lors de la sauvegarde des informations générales.' });
        }
      });
    } catch (error) {
      setAlertInfo({ type: 'error', message: `Erreur lors du processus de sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}` });
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
          Informations Générales
        </CardTitle>
        <p className="text-sm text-gray-500">
          Renseignez les informations essentielles de l'état des lieux.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {alertInfo && (
          <Alert variant={alertInfo.type === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{alertInfo.type === 'error' ? 'Erreur' : 'Information'}</AlertTitle>
            <AlertDescription>
              {alertInfo.message}
            </AlertDescription>
          </Alert>
        )}
        {rendezVousData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Certaines informations ont été pré-remplies depuis le rendez-vous du {new Date(rendezVousData.date).toLocaleDateString('fr-FR')}.
            </AlertDescription>
          </Alert>
        )}
        {/* Section Bien immobilier */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Détails du bien</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adresse_bien" className="font-medium">Adresse du bien</Label>
              <p className="text-sm text-gray-500 mb-1">Indiquez l'adresse complète du logement concerné.</p>
              <Input 
                id="adresse_bien" 
                value={formData.adresse_bien} 
                onChange={handleInputChange} 
                placeholder="Ex: 123 rue de la Paix, 75000 Paris"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type_etat_des_lieux" className="font-medium">Type d'état des lieux</Label>
                <Select 
                  value={formData.type_etat_des_lieux} 
                  onValueChange={(value) => handleSelectChange('type_etat_des_lieux', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeEtatDesLieuxOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type_bien" className="font-medium">Type de bien</Label>
                <Select 
                  value={formData.type_bien} 
                  onValueChange={(value) => handleSelectChange('type_bien', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeBienOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Section Dates Clés */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Dates importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_entree" className="font-medium">Date d'entrée</Label>
              <Input 
                id="date_entree" 
                type="date" 
                value={formData.date_entree} 
                onChange={handleInputChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date_sortie" className="font-medium">Date de sortie</Label>
              <Input 
                id="date_sortie" 
                type="date" 
                value={formData.date_sortie} 
                onChange={handleInputChange} 
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section Bailleur */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Informations sur le bailleur</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bailleur_nom" className="font-medium">Nom et prénom (ou raison sociale)</Label>
              <Input 
                id="bailleur_nom" 
                value={formData.bailleur_nom} 
                onChange={handleInputChange} 
                placeholder="Ex: Jean Dupont"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bailleur_adresse" className="font-medium">Adresse</Label>
              <Input 
                id="bailleur_adresse" 
                value={formData.bailleur_adresse} 
                onChange={handleInputChange} 
                placeholder="Ex: 456 Avenue des Champs-Élysées, 75008 Paris"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section Locataire */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Informations sur le locataire</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="locataire_nom" className="font-medium">Nom et prénom</Label>
              <Input 
                id="locataire_nom" 
                value={formData.locataire_nom} 
                onChange={handleInputChange} 
                placeholder="Ex: Marie Martin"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="locataire_adresse" className="font-medium">Nouvelle adresse (si applicable)</Label>
              <Input 
                id="locataire_adresse" 
                value={formData.locataire_adresse} 
                onChange={handleInputChange} 
                placeholder="Adresse de réexpédition du courrier"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section Photos Générales */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700">Documents et photos générales</h3>
            <Badge variant="secondary">
              {existingPhotos.length + newPhotos.length} fichier(s)
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Joignez ici des photos de la façade, le bail, ou tout autre document pertinent.
          </p>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" 
            onClick={() => !isSaving && fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              multiple 
              accept="image/*,.pdf,.doc,.docx" 
              onChange={handleFileSelect} 
              className="hidden" 
              disabled={isSaving}
            />
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation(); 
                !isSaving && fileInputRef.current?.click();
              }} 
              disabled={isSaving}
            >
              <ImageIcon className="h-4 w-4 mr-2" /> 
              Ajouter des fichiers
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Formats supportés : Images, PDF, Word.
            </p>
          </div>

          {existingPhotos.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Fichiers sauvegardés :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                    {photo.type.startsWith('image/') ? (
                      <img 
                        src={photo.url} 
                        alt={photo.name || 'Photo générale'} 
                        className="w-full h-28 object-cover" 
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur';
                        }}
                      />
                    ) : (
                      <div className="w-full h-28 flex flex-col items-center justify-center bg-gray-100 p-2">
                        <FileText className="h-10 w-10 text-gray-400" />
                        <p className="text-xs text-gray-600 mt-1 truncate w-full text-center" title={photo.name}>
                          {photo.name}
                        </p>
                      </div>
                    )}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)} 
                        className="h-6 w-6 p-0" 
                        disabled={isSaving}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2">
                      <Input 
                        type="text" 
                        placeholder="Description" 
                        value={photo.description || ''} 
                        onChange={(e) => handleExistingPhotoDescriptionChange(photo.id, e.target.value)} 
                        className="text-xs h-7 w-full" 
                        disabled={isSaving}
                      />
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {(photo.size / 1024).toFixed(1)} KB <span className="text-green-600">✓</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newPhotos.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Nouveaux fichiers à téléverser :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {newPhotos.map((photoFile, idx) => (
                  <div key={`new-general-${idx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                    {photoFile.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(photoFile)} 
                        alt={photoFile.name} 
                        className="w-full h-28 object-cover" 
                      />
                    ) : (
                      <div className="w-full h-28 flex flex-col items-center justify-center bg-gray-100 p-2">
                        <FileText className="h-10 w-10 text-gray-400" />
                        <p className="text-xs text-gray-600 mt-1 truncate w-full text-center" title={photoFile.name}>
                          {photoFile.name}
                        </p>
                      </div>
                    )}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleRemoveNewPhoto(idx)} 
                        className="h-6 w-6 p-0" 
                        disabled={isSaving}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2">
                      <Input 
                        type="text" 
                        placeholder="Description" 
                        value={photoFile.description || ''} 
                        onChange={(e) => handleNewPhotoDescriptionChange(idx, e.target.value)} 
                        className="text-xs h-7 w-full" 
                        disabled={isSaving}
                      />
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section Statut */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Statut de l'État des Lieux</h3>
          <div>
            <Label htmlFor="statut" className="font-medium">Statut actuel</Label>
            <Select 
              value={formData.statut} 
              onValueChange={(value) => handleSelectChange('statut', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                {statutOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="mt-8 pt-6 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isUpdatingMutation}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSaving || isUpdatingMutation ? 'Enregistrement en cours...' : 'Sauvegarder les informations générales'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

GeneralStep.displayName = 'GeneralStep';

export default GeneralStep;