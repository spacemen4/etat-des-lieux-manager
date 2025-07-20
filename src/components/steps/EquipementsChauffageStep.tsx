import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Thermometer, Camera, X, Upload, Image as ImageIcon, Flame } from 'lucide-react';
import type { StepRef } from '../EtatSortieForm';
import { supabase } from '@/lib/supabase';

interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  category: string; // 'equipements_chauffage' pour ce composant
  file_path: string;
}

interface EquipementChauffage {
  id?: string;
  etat_des_lieux_id: string;
  chaudiere_etat: string;
  chaudiere_date_dernier_entretien: string;
  ballon_eau_chaude_etat: string;
  radiateurs_nombre: number;
  radiateurs_etat: string;
  thermostat_present: boolean;
  thermostat_etat: string;
  pompe_a_chaleur_present: boolean;
  pompe_a_chaleur_etat: string;
  commentaires: string;
  photos: Photo[];
}

interface EquipementsChauffageStepProps {
  etatId: string;
}

// Hooks pour interagir avec Supabase
const useEquipementsChauffageByEtatId = (etatId: string) => {
  const [data, setData] = useState<EquipementChauffage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    console.log('🔄 Rechargement des équipements chauffage pour etatId:', etatId);
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('equipements_chauffage')
        .select('*')
        .eq('etat_des_lieux_id', etatId);

      if (error) throw error;

      console.log('📡 Données chargées:', result);
      setData(result || []);
    } catch (error) {
      console.error('❌ Erreur chargement équipements chauffage:', error);
      toast.error('Erreur lors du chargement des données de chauffage.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (etatId) {
      refetch();
    }
  }, [etatId]);

  return { data, refetch, isLoading };
};

const useCreateEquipementChauffage = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: Omit<EquipementChauffage, 'id'>) => {
    setIsPending(true);
    console.log('🔄 Tentative de création équipement chauffage:', data);

    const { data: result, error } = await supabase
      .from('equipements_chauffage')
      .insert([data])
      .select();

    if (error) {
      console.error('❌ Erreur création:', error);
      throw new Error(`Erreur création équipement chauffage: ${error.message}`);
    }

    console.log('✅ Création réussie:', result);
    setIsPending(false);
    return result;
  };

  return { mutateAsync, isPending };
};

const useUpdateEquipementChauffage = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: EquipementChauffage) => {
    setIsPending(true);
    console.log('🔄 Tentative de mise à jour équipement chauffage:', data);

    const { data: result, error } = await supabase
      .from('equipements_chauffage')
      .update(data)
      .eq('id', data.id)
      .select();

    if (error) {
      console.error('❌ Erreur mise à jour:', error);
      throw new Error(`Erreur mise à jour équipement chauffage: ${error.message}`);
    }

    console.log('✅ Mise à jour réussie:', result);
    setIsPending(false);
    return result;
  };

  return { mutateAsync, isPending };
};

const EquipementsChauffageStep = forwardRef<StepRef, EquipementsChauffageStepProps>(({ etatId }, ref) => {
  const { data: equipementsChauffageData, refetch, isLoading: isLoadingData } = useEquipementsChauffageByEtatId(etatId);
  const createEquipementChauffageMutation = useCreateEquipementChauffage();
  const updateEquipementChauffageMutation = useUpdateEquipementChauffage();

  const [equipementChauffage, setEquipementChauffage] = useState<EquipementChauffage>({
    etat_des_lieux_id: etatId,
    chaudiere_etat: '',
    chaudiere_date_dernier_entretien: '',
    ballon_eau_chaude_etat: '',
    radiateurs_nombre: 0,
    radiateurs_etat: '',
    thermostat_present: false,
    thermostat_etat: '',
    pompe_a_chaleur_present: false,
    pompe_a_chaleur_etat: '',
    commentaires: '',
    photos: [],
  });

  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Exposer la fonction de sauvegarde via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveData: handleSave
  }));

  useEffect(() => {
    if (equipementsChauffageData && equipementsChauffageData.length > 0) {
      const data = equipementsChauffageData[0];
      setEquipementChauffage({
        ...data,
        photos: data.photos || [],
        chaudiere_date_dernier_entretien: data.chaudiere_date_dernier_entretien || '',
        radiateurs_nombre: data.radiateurs_nombre || 0,
        thermostat_present: data.thermostat_present || false,
        pompe_a_chaleur_present: data.pompe_a_chaleur_present || false,
      });
    }
  }, [equipementsChauffageData]);

  const handleInputChange = (field: keyof EquipementChauffage, value: string | number | boolean) => {
    setEquipementChauffage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setNewPhotos(prev => [...prev, ...validFiles]);
  };

  const handleRemoveNewPhoto = (photoIndex: number) => {
    setNewPhotos(prev => prev.filter((_, index) => index !== photoIndex));
  };

  const handleNewPhotoDescriptionChange = (photoIndex: number, description: string) => {
    setNewPhotos(prev => prev.map((photo, index) => 
      index === photoIndex ? { ...photo, description } : photo
    ));
  };

  const handleRemoveExistingPhoto = async (photoId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('etat-des-lieux-photos')
        .remove([filePath]);

      if (storageError) {
        console.error('Erreur suppression storage:', storageError);
        toast.error('Erreur lors de la suppression du fichier de stockage.');
      }

      setEquipementChauffage(prev => ({
        ...prev,
        photos: prev.photos.filter(photo => photo.id !== photoId)
      }));
      toast.success('Photo retirée de la liste. Sauvegardez pour confirmer.');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la photo.');
    }
  };

  const handleExistingPhotoDescriptionChange = (photoId: string, description: string) => {
    setEquipementChauffage(prev => ({
      ...prev,
      photos: prev.photos.map(photo =>
        photo.id === photoId ? { ...photo, description } : photo
      )
    }));
  };

  const _uploadPhotos = async (): Promise<Photo[]> => {
    if (newPhotos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotosResult: Photo[] = [];

    try {
      for (const photoFile of newPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/equipements_chauffage/${timestamp}_${randomId}.${fileExtension}`;

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
          category: 'equipements_chauffage',
          file_path: fileName
        });
      }
      return uploadedPhotosResult;
    } catch (error) {
      console.error("Erreur pendant l'upload:", error);
      toast.error(`Erreur lors de l'upload des photos: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSave = async () => {
    console.log('🚀 Début de la sauvegarde');
    console.log('📊 État actuel equipementChauffage:', equipementChauffage);
    console.log('📸 Nouvelles photos:', newPhotos);
    
    setIsSaving(true);
    try {
      console.log('📸 Upload des photos...');
      const newlyUploadedPhotos = await _uploadPhotos();
      console.log('📸 Photos uploadées:', newlyUploadedPhotos);
      
      const allPhotos = [...equipementChauffage.photos, ...newlyUploadedPhotos];
      console.log('📸 Toutes les photos:', allPhotos);
      
      // Nettoyer les données pour éviter les erreurs de type
      const dataToSave = {
        ...equipementChauffage,
        photos: allPhotos,
        etat_des_lieux_id: etatId,
        // Nettoyer les champs date vides (PostgreSQL n'accepte pas "" pour une date)
        chaudiere_date_dernier_entretien: equipementChauffage.chaudiere_date_dernier_entretien || null,
        // Nettoyer les champs texte vides
        chaudiere_etat: equipementChauffage.chaudiere_etat || null,
        ballon_eau_chaude_etat: equipementChauffage.ballon_eau_chaude_etat || null,
        radiateurs_etat: equipementChauffage.radiateurs_etat || null,
        thermostat_etat: equipementChauffage.thermostat_etat || null,
        pompe_a_chaleur_etat: equipementChauffage.pompe_a_chaleur_etat || null,
        commentaires: equipementChauffage.commentaires || null,
        // S'assurer que les booléens sont bien définis
        thermostat_present: Boolean(equipementChauffage.thermostat_present),
        pompe_a_chaleur_present: Boolean(equipementChauffage.pompe_a_chaleur_present),
        // S'assurer que le nombre est bien un nombre
        radiateurs_nombre: Number(equipementChauffage.radiateurs_nombre) || 0,
      };
      
      console.log('💾 Données nettoyées à sauvegarder:', dataToSave);
      console.log('🔍 A un ID existant?', !!equipementChauffage.id);

      if (equipementChauffage.id) {
        console.log('🔄 Mise à jour de l\'équipement existant');
        await updateEquipementChauffageMutation.mutateAsync(dataToSave);
      } else {
        console.log('🆕 Création d\'un nouvel équipement');
        const { id, ...createData } = dataToSave;
        await createEquipementChauffageMutation.mutateAsync(createData);
      }
      
      setNewPhotos([]);
      console.log('✅ Sauvegarde terminée avec succès');
      toast.success('Équipements de chauffage sauvegardés avec succès !');
      refetch();
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      console.error("❌ Stack trace:", error.stack);
      toast.error('Erreur lors de la sauvegarde des équipements de chauffage.');
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
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Équipements de chauffage
        </CardTitle>
        <p className="text-sm text-gray-600">
          Renseignez l'état des équipements de chauffage du logement (chaudière, radiateurs, thermostat, etc.).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chaudière */}
        <div className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-lg text-slate-700">Chaudière</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chaudiere_etat" className="font-medium">État de la chaudière</Label>
              <Input
                id="chaudiere_etat"
                value={equipementChauffage.chaudiere_etat}
                onChange={(e) => handleInputChange('chaudiere_etat', e.target.value)}
                placeholder="Ex: Bon état, Entretien nécessaire, Défaillante"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="chaudiere_date_dernier_entretien" className="font-medium">Date du dernier entretien</Label>
              <Input
                id="chaudiere_date_dernier_entretien"
                type="date"
                value={equipementChauffage.chaudiere_date_dernier_entretien}
                onChange={(e) => handleInputChange('chaudiere_date_dernier_entretien', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Ballon d'eau chaude */}
        <div className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm">
          <h4 className="font-semibold text-lg text-slate-700">Ballon d'eau chaude</h4>
          <div>
            <Label htmlFor="ballon_eau_chaude_etat" className="font-medium">État du ballon d'eau chaude</Label>
            <Input
              id="ballon_eau_chaude_etat"
              value={equipementChauffage.ballon_eau_chaude_etat}
              onChange={(e) => handleInputChange('ballon_eau_chaude_etat', e.target.value)}
              placeholder="Ex: Bon état, Fuite, Thermostat défaillant"
              className="mt-1"
            />
          </div>
        </div>

        {/* Radiateurs */}
        <div className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm">
          <h4 className="font-semibold text-lg text-slate-700">Radiateurs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="radiateurs_nombre" className="font-medium">Nombre de radiateurs</Label>
              <Input
                id="radiateurs_nombre"
                type="number"
                min="0"
                value={equipementChauffage.radiateurs_nombre}
                onChange={(e) => handleInputChange('radiateurs_nombre', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="radiateurs_etat" className="font-medium">État des radiateurs</Label>
              <Input
                id="radiateurs_etat"
                value={equipementChauffage.radiateurs_etat}
                onChange={(e) => handleInputChange('radiateurs_etat', e.target.value)}
                placeholder="Ex: Bon état, Purge nécessaire, Robinets défaillants"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Thermostat */}
        <div className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm">
          <h4 className="font-semibold text-lg text-slate-700">Thermostat</h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="thermostat_present"
                checked={equipementChauffage.thermostat_present}
                onCheckedChange={(checked) => handleInputChange('thermostat_present', Boolean(checked))}
              />
              <Label htmlFor="thermostat_present" className="font-medium">Thermostat présent</Label>
            </div>
            
            {equipementChauffage.thermostat_present && (
              <div>
                <Label htmlFor="thermostat_etat" className="font-medium">État du thermostat</Label>
                <Input
                  id="thermostat_etat"
                  value={equipementChauffage.thermostat_etat}
                  onChange={(e) => handleInputChange('thermostat_etat', e.target.value)}
                  placeholder="Ex: Fonctionne parfaitement, Écran défaillant, Programmation défectueuse"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Pompe à chaleur */}
        <div className="p-4 border rounded-lg space-y-4 bg-slate-50 shadow-sm">
          <h4 className="font-semibold text-lg text-slate-700">Pompe à chaleur</h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pompe_a_chaleur_present"
                checked={equipementChauffage.pompe_a_chaleur_present}
                onCheckedChange={(checked) => handleInputChange('pompe_a_chaleur_present', Boolean(checked))}
              />
              <Label htmlFor="pompe_a_chaleur_present" className="font-medium">Pompe à chaleur présente</Label>
            </div>
            
            {equipementChauffage.pompe_a_chaleur_present && (
              <div>
                <Label htmlFor="pompe_a_chaleur_etat" className="font-medium">État de la pompe à chaleur</Label>
                <Input
                  id="pompe_a_chaleur_etat"
                  value={equipementChauffage.pompe_a_chaleur_etat}
                  onChange={(e) => handleInputChange('pompe_a_chaleur_etat', e.target.value)}
                  placeholder="Ex: Bon état, Bruyante, Manque de gaz réfrigérant"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Commentaires */}
        <div>
          <Label htmlFor="commentaires" className="font-medium">Commentaires généraux</Label>
          <Input
            id="commentaires"
            value={equipementChauffage.commentaires}
            onChange={(e) => handleInputChange('commentaires', e.target.value)}
            placeholder="Observations particulières sur les équipements de chauffage..."
            className="mt-1"
          />
        </div>

        {/* Section Photos */}
        <div className="space-y-3 pt-3 border-t mt-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-slate-600" />
            <h5 className="font-medium text-slate-700">Photos des équipements de chauffage</h5>
            <Badge variant="outline">{equipementChauffage.photos.length + newPhotos.length} photo(s)</Badge>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhotos}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Ajouter des photos
            </Button>
            <p className="text-xs text-gray-500 mt-1">Max 5MB par image.</p>
          </div>

          {/* Photos existantes */}
          {equipementChauffage.photos.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h6>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {equipementChauffage.photos.map((photo) => (
                  <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm">
                    <img src={photo.url} alt={photo.name} className="w-full h-28 object-cover" />
                    <div className="p-2 space-y-1">
                      <Input
                        type="text"
                        placeholder="Description..."
                        value={photo.description || ''}
                        onChange={(e) => handleExistingPhotoDescriptionChange(photo.id, e.target.value)}
                        className="text-xs h-7 w-full"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 truncate" title={photo.name}>
                          {(photo.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)}
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
          {newPhotos.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-sm font-medium text-gray-600">Nouvelles photos (non sauvegardées) :</h6>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {newPhotos.map((photoFile, photoIdx) => (
                  <div key={`new-${photoIdx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm">
                    <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                    <div className="p-2 space-y-1">
                      <Input
                        type="text"
                        placeholder="Description..."
                        value={photoFile.description || ''}
                        onChange={(e) => handleNewPhotoDescriptionChange(photoIdx, e.target.value)}
                        className="text-xs h-7 w-full"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 truncate" title={photoFile.name}>
                          {(photoFile.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewPhoto(photoIdx)}
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

        {/* Bouton de sauvegarde */}
        <div className="mt-6 pt-6 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || uploadingPhotos}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : 'Sauvegarder les équipements de chauffage'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

EquipementsChauffageStep.displayName = 'EquipementsChauffageStep';

export default EquipementsChauffageStep;
