import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Flame, Droplets, User, Camera, X, Upload, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import type { StepRef } from '../EtatSortieForm';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEmployes } from '@/context/EmployeContext';

interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  category: 'electricite' | 'gaz' | 'eau';
  file_path: string;
}

interface ReleveCompteurs {
  id: string;
  etat_des_lieux_id: string;
  nom_ancien_occupant: string | null;
  electricite_n_compteur: string | null;
  electricite_h_pleines: string | null;
  electricite_h_creuses: string | null;
  gaz_naturel_n_compteur: string | null;
  gaz_naturel_releve: string | null;
  eau_chaude_m3: string | null;
  eau_froide_m3: string | null;
  photos: Photo[];
}

interface ReleveCompteursStepProps {
  etatId: string;
}

const ReleveCompteursStep = forwardRef<StepRef, ReleveCompteursStepProps>(({ etatId = '1' }, ref) => {
  console.log('[ReleveCompteursStep] Render - etatId:', etatId);
  const { selectedEmployeId } = useEmployes();
  
  const [releveCompteurs, setReleveCompteurs] = useState<ReleveCompteurs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState({
    nom_ancien_occupant: '',
    electricite_n_compteur: '',
    electricite_h_pleines: '',
    electricite_h_creuses: '',
    gaz_naturel_n_compteur: '',
    gaz_naturel_releve: '',
    eau_chaude_m3: '',
    eau_froide_m3: '',
  });

  const [newPhotos, setNewPhotos] = useState<{
    electricite: (File & { description?: string })[];
    gaz: (File & { description?: string })[];
    eau: (File & { description?: string })[];
  }>({
    electricite: [],
    gaz: [],
    eau: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Exposer la fonction de sauvegarde via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveData: handleSave
  }));

  // Fonction pour charger les données
  const loadData = async () => {
    console.log('🔄 Chargement des données...');
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('releve_compteurs')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        console.log('✅ Données chargées:', data);
        const photos = data.photos || [];
        const transformedData = { ...data, photos };

        setReleveCompteurs(transformedData);
        setFormData({
          nom_ancien_occupant: data.nom_ancien_occupant || '',
          electricite_n_compteur: data.electricite_n_compteur || '',
          electricite_h_pleines: data.electricite_h_pleines || '',
          electricite_h_creuses: data.electricite_h_creuses || '',
          gaz_naturel_n_compteur: data.gaz_naturel_n_compteur || '',
          gaz_naturel_releve: data.gaz_naturel_releve || '',
          eau_chaude_m3: data.eau_chaude_m3 || '',
          eau_froide_m3: data.eau_froide_m3 || '',
        });
      } else {
        console.log('ℹ️ Aucune donnée existante');
        setReleveCompteurs(null);
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadData();
  }, [etatId]);

  // Réinitialiser les nouvelles photos quand l'etatId change
  useEffect(() => {
    setNewPhotos({
      electricite: [],
      gaz: [],
      eau: []
    });
  }, [etatId]);

  const validateNumericField = (field: string, value: string): string => {
    const numericFields = ['electricite_h_pleines', 'electricite_h_creuses', 'gaz_naturel_releve', 'eau_chaude_m3', 'eau_froide_m3'];
    
    if (numericFields.includes(field) && value) {
      if (isNaN(Number(value))) {
        return 'Veuillez saisir un nombre valide';
      }
      if (Number(value) < 0) {
        return 'La valeur ne peut pas être négative';
      }
    }
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      const value = formData[field as keyof typeof formData];
      const error = validateNumericField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    const error = validateNumericField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, category: 'electricite' | 'gaz' | 'eau') => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: (File & { description?: string })[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        setAlertInfo({ type: 'error', message: `Le fichier ${file.name} est trop volumineux (max 5MB)` });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setAlertInfo({ type: 'error', message: `Le fichier ${file.name} n'est pas une image` });
        return;
      }

      const fileWithDescription = file as File & { description?: string };
      fileWithDescription.description = '';
      validFiles.push(fileWithDescription);
    });

    setNewPhotos(prev => ({
      ...prev,
      [category]: [...prev[category], ...validFiles]
    }));
  };

  const handleRemoveNewPhoto = (category: 'electricite' | 'gaz' | 'eau', index: number) => {
    setNewPhotos(prev => {
      const categoryPhotos = [...prev[category]];
      categoryPhotos.splice(index, 1);
      return {
        ...prev,
        [category]: categoryPhotos
      };
    });
  };

  const handleRemoveExistingPhoto = async (photoId: string, filePath: string) => {
    try {
      console.log(`🗑️ Suppression de la photo: ${photoId}`);
      
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('etat-des-lieux-photos')
        .remove([filePath]);

      if (storageError) {
        console.error('❌ Erreur lors de la suppression du fichier:', storageError);
      }

      // Mettre à jour les photos dans la base de données
      const updatedPhotos = releveCompteurs?.photos.filter(photo => photo.id !== photoId) || [];
      
      const { error: updateError } = await supabase
        .from('releve_compteurs')
        .update({ photos: updatedPhotos })
        .eq('id', releveCompteurs!.id);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour l'état local
      setReleveCompteurs(prev => prev ? { ...prev, photos: updatedPhotos } : null);
      
      setAlertInfo({ type: 'success', message: 'Photo supprimée avec succès' });
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setAlertInfo({ type: 'error', message: 'Erreur lors de la suppression de la photo' });
    }
  };

  const handleNewPhotoDescriptionChange = (category: 'electricite' | 'gaz' | 'eau', index: number, description: string) => {
    setNewPhotos(prev => {
      const categoryPhotos = [...prev[category]];
      categoryPhotos[index] = { ...categoryPhotos[index], description };
      return {
        ...prev,
        [category]: categoryPhotos
      };
    });
  };

  const handleExistingPhotoDescriptionChange = (photoId: string, description: string) => {
    setReleveCompteurs(prev => {
      if (!prev) return null;
      
      const updatedPhotos = prev.photos.map(photo => 
        photo.id === photoId ? { ...photo, description } : photo
      );
      
      return { ...prev, photos: updatedPhotos };
    });
  };

  const uploadPhotos = async (): Promise<Photo[]> => {
    console.log('🚀 Début de l\'upload des photos');
    
    const allNewPhotos = [...newPhotos.electricite, ...newPhotos.gaz, ...newPhotos.eau];
    
    if (allNewPhotos.length === 0) {
      console.log('✅ Aucune photo à uploader');
      return [];
    }

    setUploadingPhotos(true);
    const uploadedPhotos: Photo[] = [];

    try {
      for (const photo of allNewPhotos) {
        console.log(`📤 Upload de ${photo.name}...`);

        // Déterminer la catégorie
        let category: 'electricite' | 'gaz' | 'eau' = 'electricite';
        if (newPhotos.gaz.includes(photo)) category = 'gaz';
        else if (newPhotos.eau.includes(photo)) category = 'eau';

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photo.name.split('.').pop();
        const fileName = `${etatId}/${category}/${timestamp}_${randomId}.${fileExtension}`;

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('etat-des-lieux-photos')
          .upload(fileName, photo);

        if (uploadError) {
          throw new Error(`Erreur upload ${photo.name}: ${uploadError.message}`);
        }

        // Obtenir l'URL publique
        const { data: publicUrlData } = supabase.storage
          .from('etat-des-lieux-photos')
          .getPublicUrl(fileName);

        const uploadedPhoto: Photo = {
          id: `${timestamp}_${randomId}`,
          name: photo.name,
          size: photo.size,
          type: photo.type,
          url: publicUrlData.publicUrl,
          description: photo.description || '',
          category,
          file_path: fileName
        };

        uploadedPhotos.push(uploadedPhoto);
        console.log(`✅ Photo uploadée: ${photo.name}`);
      }

      return uploadedPhotos;
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setAlertInfo({ type: 'error', message: 'Veuillez corriger les erreurs avant de sauvegarder' });
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('💾 Début de la sauvegarde...');
      
      // Upload des nouvelles photos
      const uploadedPhotos = await uploadPhotos();
      
      // Combiner les photos existantes et nouvelles
      const existingPhotos = releveCompteurs?.photos || [];
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      // Préparer les données
      const dataToSave = {
        ...formData,
        etat_des_lieux_id: etatId,
        photos: allPhotos,
        employe_id: selectedEmployeId ?? null,
      };

      console.log('📝 Données à sauvegarder:', dataToSave);

      let result;
      if (releveCompteurs?.id) {
        // Mise à jour
        const { data, error } = await supabase
          .from('releve_compteurs')
          .update(dataToSave)
          .eq('id', releveCompteurs.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Création
        const { data, error } = await supabase
          .from('releve_compteurs')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      console.log('✅ Sauvegarde réussie:', result);
      
      // Mettre à jour l'état local
      setReleveCompteurs(result);
      
      // Réinitialiser les nouvelles photos
      setNewPhotos({
        electricite: [],
        gaz: [],
        eau: []
      });
      
      setAlertInfo({ type: 'success', message: 'Relevé des compteurs sauvegardé avec succès' });
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      setAlertInfo({ type: 'error', message: 'Erreur lors de la sauvegarde. Vérifiez votre configuration Supabase.' });
    } finally {
      setIsSaving(false);
    }
  };

  const PhotoUploadSection = ({ 
    category, 
    title, 
    icon, 
    description 
  }: { 
    category: 'electricite' | 'gaz' | 'eau'; 
    title: string; 
    icon: React.ReactNode; 
    description: string;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const existingPhotos = releveCompteurs?.photos.filter(p => p.category === category) || [];
    const newCategoryPhotos = newPhotos[category];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          {icon}
          <h4 className="font-medium">{title}</h4>
          <Badge variant="outline" className="text-xs">
            {existingPhotos.length + newCategoryPhotos.length} photo{existingPhotos.length + newCategoryPhotos.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e, category)}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <div className="space-y-2">
                <Upload className="h-6 w-6 mx-auto text-gray-400" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Ajouter photos
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Photos existantes */}
            {existingPhotos.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Photos sauvegardées</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Erreur de chargement de l\'image:', photo.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="p-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{photo.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)}
                            className="text-red-500 hover:text-red-700 h-5 w-5 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(photo.size / 1024).toFixed(1)} KB
                          <span className="ml-2 text-green-600">✓ Sauvegardée</span>
                        </p>
                        <Input
                          type="text"
                          placeholder="Description"
                          value={photo.description || ''}
                          onChange={(e) => handleExistingPhotoDescriptionChange(photo.id, e.target.value)}
                          className="text-xs h-7"
                          key={`existing-${photo.id}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nouvelles photos */}
            {newCategoryPhotos.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Nouvelles photos</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {newCategoryPhotos.map((photo, index) => (
                    <div key={`new-${category}-${index}`} className="relative border rounded-lg overflow-hidden bg-white">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{photo.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveNewPhoto(category, index)}
                            className="text-red-500 hover:text-red-700 h-5 w-5 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(photo.size / 1024).toFixed(1)} KB
                          <span className="ml-2 text-orange-600">⏳ À sauvegarder</span>
                        </p>
                        <Input
                          type="text"
                          placeholder="Description"
                          value={photo.description || ''}
                          onChange={(e) => handleNewPhotoDescriptionChange(category, index, e.target.value)}
                          className="text-xs h-7"
                          key={`new-${category}-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasErrors = Object.values(errors).some(error => error !== '');
  const hasExistingData = releveCompteurs && (
    releveCompteurs.nom_ancien_occupant ||
    releveCompteurs.electricite_n_compteur ||
    releveCompteurs.gaz_naturel_n_compteur ||
    releveCompteurs.eau_chaude_m3
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Chargement des données...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-red-500">
            <p className="text-sm">Erreur lors du chargement des données</p>
            <p className="text-xs mt-1">Vérifiez votre configuration Supabase</p>
            <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-1">
            Relevé des compteurs
          </Badge>
          Relevé des compteurs
          {hasExistingData && (
            <Badge variant="secondary" className="ml-2">
              Dernier relevé chargé
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Saisissez ici toutes les informations relatives aux compteurs d'énergie et d'eau du logement.
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
        {/* Section Ancien occupant */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <User className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Transfert de compteur</h3>
          </div>
          <div>
            <Label htmlFor="nom_ancien_occupant">
              Nom de l'ancien occupant
            </Label>
            <Input
              id="nom_ancien_occupant"
              type="text"
              value={formData.nom_ancien_occupant}
              onChange={(e) => handleInputChange('nom_ancien_occupant', e.target.value)}
              placeholder="Nom complet de l'ancien occupant pour le transfert"
            />
          </div>
        </div>

        {/* Section Électricité */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Électricité</h3>
          </div>
          
          <div>
            <Label htmlFor="electricite_n_compteur">
              Numéro de compteur électrique
            </Label>
            <Input
              id="electricite_n_compteur"
              type="text"
              value={formData.electricite_n_compteur}
              onChange={(e) => handleInputChange('electricite_n_compteur', e.target.value)}
              placeholder="Ex: 12345678901234"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="electricite_h_pleines" className="flex items-center gap-2">
                Index heures pleines
                <Badge variant="secondary" className="text-xs">kWh</Badge>
              </Label>
              <Input
                id="electricite_h_pleines"
                type="text"
                value={formData.electricite_h_pleines}
                onChange={(e) => handleInputChange('electricite_h_pleines', e.target.value)}
                placeholder="Ex: 12345"
                className={errors.electricite_h_pleines ? 'border-red-500' : ''}
              />
              {errors.electricite_h_pleines && (
                <p className="text-sm text-red-500 mt-1">{errors.electricite_h_pleines}</p>
              )}
            </div>
            <div>
              <Label htmlFor="electricite_h_creuses" className="flex items-center gap-2">
                Index heures creuses
                <Badge variant="secondary" className="text-xs">kWh</Badge>
              </Label>
              <Input
                id="electricite_h_creuses"
                type="text"
                value={formData.electricite_h_creuses}
                onChange={(e) => handleInputChange('electricite_h_creuses', e.target.value)}
                placeholder="Ex: 8765"
                className={errors.electricite_h_creuses ? 'border-red-500' : ''}
              />
              {errors.electricite_h_creuses && (
                <p className="text-sm text-red-500 mt-1">{errors.electricite_h_creuses}</p>
              )}
            </div>
          </div>

          <PhotoUploadSection
            category="electricite"
            title="Photos du compteur électrique"
            icon={<Camera className="h-4 w-4 text-yellow-500" />}
            description="Compteur, numéro de série, index affichés"
          />
        </div>

        {/* Section Gaz */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Gaz naturel</h3>
          </div>
          
          <div>
            <Label htmlFor="gaz_naturel_n_compteur">
              Numéro de compteur gaz
            </Label>
            <Input
              id="gaz_naturel_n_compteur"
              type="text"
              value={formData.gaz_naturel_n_compteur}
              onChange={(e) => handleInputChange('gaz_naturel_n_compteur', e.target.value)}
              placeholder="Ex: 12345678"
            />
          </div>
          
          <div>
            <Label htmlFor="gaz_naturel_releve" className="flex items-center gap-2">
              Index gaz naturel
              <Badge variant="secondary" className="text-xs">m³</Badge>
            </Label>
            <Input
              id="gaz_naturel_releve"
              type="text"
              value={formData.gaz_naturel_releve}
              onChange={(e) => handleInputChange('gaz_naturel_releve', e.target.value)}
              placeholder="Ex: 2345"
              className={errors.gaz_naturel_releve ? 'border-red-500' : ''}
            />
            {errors.gaz_naturel_releve && (
              <p className="text-sm text-red-500 mt-1">{errors.gaz_naturel_releve}</p>
            )}
          </div>

          <PhotoUploadSection
            category="gaz"
            title="Photos du compteur gaz"
            icon={<Camera className="h-4 w-4 text-orange-500" />}
            description="Compteur, numéro de série, index affiché"
          />
        </div>

        {/* Section Eau */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Droplets className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Eau</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eau_chaude_m3" className="flex items-center gap-2">
                Index eau chaude
                <Badge variant="secondary" className="text-xs">m³</Badge>
              </Label>
              <Input
                id="eau_chaude_m3"
                type="text"
                value={formData.eau_chaude_m3}
                onChange={(e) => handleInputChange('eau_chaude_m3', e.target.value)}
                placeholder="Ex: 123"
                className={errors.eau_chaude_m3 ? 'border-red-500' : ''}
              />
              {errors.eau_chaude_m3 && (
                <p className="text-sm text-red-500 mt-1">{errors.eau_chaude_m3}</p>
              )}
              {releveCompteurs?.eau_chaude_m3 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernier index eau chaude: {releveCompteurs.eau_chaude_m3}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="eau_froide_m3" className="flex items-center gap-2">
                Index eau froide
                <Badge variant="secondary" className="text-xs">m³</Badge>
              </Label>
              <Input
                id="eau_froide_m3"
                type="text"
                value={formData.eau_froide_m3}
                onChange={(e) => handleInputChange('eau_froide_m3', e.target.value)}
                placeholder="Ex: 456"
                className={errors.eau_froide_m3 ? 'border-red-500' : ''}
              />
              {errors.eau_froide_m3 && (
                <p className="text-sm text-red-500 mt-1">{errors.eau_froide_m3}</p>
              )}
              {releveCompteurs?.eau_froide_m3 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernier index eau froide: {releveCompteurs.eau_froide_m3}
                </p>
              )}
            </div>
          </div>

          {/* Photos Eau */}
          <PhotoUploadSection
            category="eau"
            title="Photos des compteurs d'eau"
            icon={<Camera className="h-4 w-4 text-blue-500" />}
            description="Compteurs eau chaude et froide, index affichés"
          />
        </div>

        {/* Bouton de sauvegarde */}
        {/* Bouton de sauvegarde */}
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || hasErrors || uploadingPhotos}
            className="w-full"
            size="lg"
          >
            {uploadingPhotos ? 'Upload des photos...' : 
              isSaving ? 'Sauvegarde en cours...' : 
              hasExistingData ? 'Mettre à jour le relevé' : 'Enregistrer le relevé'}
          </Button>
          {hasErrors && (
            <p className="text-sm text-red-500 mt-2 text-center">
              Veuillez corriger les erreurs avant de sauvegarder
            </p>
          )}
        </div>

        {/* Note informative */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Instructions pour un relevé de compteur précis</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              <li>Effectuez le relevé à la date la plus proche de l'état des lieux pour une facturation exacte.</li>
              <li>Prenez des photos nettes de chaque compteur, en vous assurant que le numéro de série et l'index (les chiffres de consommation) sont bien visibles.</li>
              <li>Indiquer le nom de l'ancien occupant est essentiel pour accélérer le transfert des contrats d'énergie.</li>
              <li>Seuls les champs remplis seront enregistrés. Les champs laissés vides seront ignorés.</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
});

ReleveCompteursStep.displayName = 'ReleveCompteursStep';

export default ReleveCompteursStep;