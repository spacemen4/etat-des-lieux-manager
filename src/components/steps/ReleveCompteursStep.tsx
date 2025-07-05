import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReleveCompteursByEtatId, useUpdateReleveCompteurs } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Zap, Flame, Droplets, User, Camera, X, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Photo {
  id?: string;
  file?: File;
  url?: string;
  name: string;
  size: number;
  type: string;
  description?: string;
  category: 'electricite' | 'gaz' | 'eau';
  file_path?: string;
}

interface PhotoRecord {
  id: string;
  releve_compteurs_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  description: string | null;
}

interface ReleveCompteursStepProps {
  etatId: string;
}

const ReleveCompteursStep: React.FC<ReleveCompteursStepProps> = ({ etatId }) => {
  console.log('[ReleveCompteursStep] Render - etatId:', etatId);
  const { data: releveCompteurs, refetch, isLoading, error } = useReleveCompteursByEtatId(etatId);
  console.log('[ReleveCompteursStep] Hook useReleveCompteursByEtatId:', releveCompteurs, 'isLoading:', isLoading, 'error:', error);
  const updateReleveCompteursMutation = useUpdateReleveCompteurs();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [photos, setPhotos] = useState<{
    electricite: Photo[];
    gaz: Photo[];
    eau: Photo[];
  }>({
    electricite: [],
    gaz: [],
    eau: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  // Ajout d'un état pour suivre si les données initiales ont été chargées
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Fonction pour charger les photos existantes depuis la base
  const loadExistingPhotos = async (releveId: string) => {
  if (!releveId) return;
  
  setLoadingPhotos(true);
  
  try {
    const { data, error } = await supabase
      .from('releve_compteurs_photos')
      .select('*')
      .eq('releve_compteurs_id', releveId)
      .order('uploaded_at', { ascending: true });

    if (error) throw error;

    const categorizedPhotos = {
      electricite: [] as Photo[],
      gaz: [] as Photo[],
      eau: [] as Photo[],
    };

    if (data) {
      for (const photoRecord of data) {
        try {
          const category = photoRecord.file_path.includes('/gaz/') ? 'gaz' : 
                         photoRecord.file_path.includes('/eau/') ? 'eau' : 'electricite';

          const { data: publicUrlData } = supabase.storage
            .from('etat-des-lieux-photos')
            .getPublicUrl(photoRecord.file_path);

          categorizedPhotos[category].push({
            id: photoRecord.id,
            name: photoRecord.file_name,
            size: photoRecord.file_size,
            type: photoRecord.mime_type,
            url: publicUrlData.publicUrl,
            description: photoRecord.description || '',
            category,
            file_path: photoRecord.file_path
          });
        } catch (photoError) {
          console.error(`Error processing photo ${photoRecord.id}:`, photoError);
        }
      }
    }

    setPhotos(categorizedPhotos);
  } catch (error) {
    console.error('Error loading photos:', error);
    toast.error('Erreur lors du chargement des photos');
  } finally {
    setLoadingPhotos(false);
  }
};

  // Fonction pour recharger les données
  const handleRefreshData = async () => {
    console.log('🔄 Rechargement des données...');
    try {
      await refetch();
      if (releveCompteurs?.id) {
        await loadExistingPhotos(releveCompteurs.id);
      }
      toast.success('Données rechargées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du rechargement:', error);
      toast.error('Erreur lors du rechargement des données');
    }
  };

  // Chargement initial des données
  useEffect(() => {
  if (releveCompteurs && !initialDataLoaded) {
    setFormData({
      nom_ancien_occupant: releveCompteurs.nom_ancien_occupant || '',
      electricite_n_compteur: releveCompteurs.electricite_n_compteur || '',
      electricite_h_pleines: releveCompteurs.electricite_h_pleines || '',
      electricite_h_creuses: releveCompteurs.electricite_h_creuses || '',
      gaz_naturel_n_compteur: releveCompteurs.gaz_naturel_n_compteur || '',
      gaz_naturel_releve: releveCompteurs.gaz_naturel_releve || '',
      eau_chaude_m3: releveCompteurs.eau_chaude_m3 || '',
      eau_froide_m3: releveCompteurs.eau_froide_m3 || '',
    });

    if (releveCompteurs.id) {
      loadExistingPhotos(releveCompteurs.id);
    }
    
    setInitialDataLoaded(true);
  }
}, [releveCompteurs, initialDataLoaded]);

  // Réinitialiser dataLoaded quand l'etatId change
  useEffect(() => {
    setDataLoaded(false);
    setPhotos({
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
    
    // Validate numeric fields
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, category: 'electricite' | 'gaz' | 'eau') => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: Photo[] = [];
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

      const photo: Photo = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        category,
      };

      newPhotos.push(photo);
    });

    setPhotos(prev => ({
      ...prev,
      [category]: [...prev[category], ...newPhotos]
    }));
  };

  const handleRemovePhoto = async (category: 'electricite' | 'gaz' | 'eau', index: number) => {
    const photo = photos[category][index];
    
    // Si c'est une photo existante (avec ID), la supprimer de Supabase
    if (photo.id && photo.file_path) {
      try {
        console.log(`🗑️ Suppression de la photo: ${photo.name}`);
        
        // Supprimer le fichier du storage
        const { error: storageError } = await supabase.storage
          .from('etat-des-lieux-photos')
          .remove([photo.file_path]);

        if (storageError) {
          console.error('❌ Erreur lors de la suppression du fichier:', storageError);
        }

        // Supprimer l'enregistrement de la base de données
        const { error: dbError } = await supabase
          .from('releve_compteurs_photos')
          .delete()
          .eq('id', photo.id);

        if (dbError) {
          console.error('❌ Erreur lors de la suppression de l\'enregistrement:', dbError);
          toast.error('Erreur lors de la suppression de la photo');
          return;
        }

        toast.success('Photo supprimée avec succès');
        console.log(`✅ Photo supprimée: ${photo.name}`);
      } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la photo');
        return;
      }
    }

    // Mettre à jour l'état local
    setPhotos(prev => {
      const categoryPhotos = [...prev[category]];
      // Nettoyer l'URL si c'est un nouveau fichier
      if (categoryPhotos[index].url && categoryPhotos[index].file) {
        URL.revokeObjectURL(categoryPhotos[index].url!);
      }
      categoryPhotos.splice(index, 1);
      return {
        ...prev,
        [category]: categoryPhotos
      };
    });
  };

  const handlePhotoDescriptionChange = (category: 'electricite' | 'gaz' | 'eau', index: number, description: string) => {
    setPhotos(prev => {
      const categoryPhotos = [...prev[category]];
      categoryPhotos[index] = { ...categoryPhotos[index], description };
      return {
        ...prev,
        [category]: categoryPhotos
      };
    });
  };

  const uploadPhotos = async (releveId: string): Promise<void> => {
    console.log('🚀 Début de l\'upload des photos vers Supabase');
    
    const allPhotos = [...photos.electricite, ...photos.gaz, ...photos.eau];
    const photosToUpload = allPhotos.filter(photo => photo.file);
    
    console.log('📊 Statistiques des photos:');
    console.log('- Total photos:', allPhotos.length);
    console.log('- Photos à uploader:', photosToUpload.length);
    console.log('- Photos par catégorie:', {
      electricite: photos.electricite.length,
      gaz: photos.gaz.length,
      eau: photos.eau.length
    });
    
    if (photosToUpload.length === 0) {
      console.log('✅ Aucune photo à uploader');
      return;
    }

    setUploadingPhotos(true);

    try {
      let uploadSuccessCount = 0;
      let uploadErrorCount = 0;

      for (let i = 0; i < photosToUpload.length; i++) {
        const photo = photosToUpload[i];
        
        console.log(`\n📤 Upload photo ${i + 1}/${photosToUpload.length}:`);
        console.log('- Nom:', photo.name);
        console.log('- Taille:', photo.size, 'bytes');
        console.log('- Type:', photo.type);
        console.log('- Catégorie:', photo.category);
        console.log('- Description:', photo.description || 'Aucune');

        if (!photo.file) {
          console.log('❌ Pas de fichier pour cette photo, skip');
          continue;
        }

        try {
          console.log('🌐 Upload vers Supabase Storage');
          const startTime = Date.now();
          
          // Générer un nom de fichier unique
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          const fileExtension = photo.name.split('.').pop();
          const fileName = `${etatId}/${photo.category}/${timestamp}_${randomId}.${fileExtension}`;
          
          console.log('📁 Nom du fichier:', fileName);

          // Upload vers Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('etat-des-lieux-photos')
            .upload(fileName, photo.file, {
              cacheControl: '3600',
              upsert: false
            });

          const endTime = Date.now();
          console.log(`⏱️ Temps de réponse: ${endTime - startTime}ms`);

          if (uploadError) {
            console.error('❌ Erreur Supabase Storage:', uploadError);
            throw new Error(`Erreur Supabase Storage: ${uploadError.message}`);
          }

          console.log('✅ Upload Supabase Storage réussi:', uploadData);

          // Obtenir l'URL publique du fichier
          const { data: publicUrlData } = supabase.storage
            .from('etat-des-lieux-photos')
            .getPublicUrl(fileName);

          if (!publicUrlData.publicUrl) {
            throw new Error('Impossible d\'obtenir l\'URL publique');
          }

          console.log('🔗 URL publique:', publicUrlData.publicUrl);
          
          // Insérer l'enregistrement dans la table releve_compteurs_photos
          const { data: dbData, error: dbError } = await supabase
            .from('releve_compteurs_photos')
            .insert({
              releve_compteurs_id: releveId,
              file_name: photo.name,
              file_path: fileName,
              file_size: photo.size,
              mime_type: photo.type,
              description: photo.description || null,
            })
            .select()
            .single();

          if (dbError) {
            console.error('❌ Erreur insertion base de données:', dbError);
            // Supprimer le fichier uploadé si l'insertion échoue
            await supabase.storage
              .from('etat-des-lieux-photos')
              .remove([fileName]);
            throw new Error(`Erreur base de données: ${dbError.message}`);
          }

          console.log('✅ Enregistrement base de données réussi:', dbData);
          
          uploadSuccessCount++;
          
          console.log(`✅ Photo ${photo.name} uploadée avec succès dans la catégorie ${photo.category}`);
          
          // Nettoyer l'URL temporaire
          if (photo.url) {
            URL.revokeObjectURL(photo.url);
          }
          
        } catch (photoError) {
          uploadErrorCount++;
          console.error(`❌ Erreur lors de l'upload de ${photo.name}:`, photoError);
          
          // Messages d'erreur plus spécifiques
          if (photoError.message.includes('Bucket not found')) {
            toast.error(`Bucket 'etat-des-lieux-photos' introuvable`);
          } else if (photoError.message.includes('Invalid JWT')) {
            toast.error(`Erreur d'authentification Supabase`);
          } else if (photoError.message.includes('File size')) {
            toast.error(`Fichier ${photo.name} trop volumineux`);
          } else {
            toast.error(`Erreur lors de l'upload de ${photo.name}`);
          }
        }
      }

      console.log('\n📊 Résumé de l\'upload:');
      console.log('- Succès:', uploadSuccessCount);
      console.log('- Erreurs:', uploadErrorCount);
      
      if (uploadErrorCount > 0 && uploadSuccessCount === 0) {
        console.log('❌ Aucune photo uploadée avec succès');
        throw new Error(`Échec de l'upload de toutes les photos (${uploadErrorCount} erreurs)`);
      }

      if (uploadSuccessCount > 0) {
        toast.success(`${uploadSuccessCount} photo(s) uploadée(s) avec succès`);
      }

    } catch (error) {
      console.error('💥 Erreur générale lors de l\'upload des photos:', error);
      toast.error('Erreur lors de l\'upload des photos');
      throw error;
    } finally {
      setUploadingPhotos(false);
      console.log('🏁 Fin de l\'upload des photos');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    try {
      console.log('💾 Début de la sauvegarde...');
      
      // Préparer les données du formulaire
      const payload = {
        ...(releveCompteurs?.id && { id: releveCompteurs.id }),
        etat_des_lieux_id: etatId,
        nom_ancien_occupant: formData.nom_ancien_occupant || null,
        electricite_n_compteur: formData.electricite_n_compteur || null,
        electricite_h_pleines: formData.electricite_h_pleines || null,
        electricite_h_creuses: formData.electricite_h_creuses || null,
        gaz_naturel_n_compteur: formData.gaz_naturel_n_compteur || null,
        gaz_naturel_releve: formData.gaz_naturel_releve || null,
        eau_chaude_m3: formData.eau_chaude_m3 || null,
        eau_froide_m3: formData.eau_froide_m3 || null,
        photos: {}, // On ne stocke plus les photos dans ce champ JSON
      };

      console.log('📝 Données à sauvegarder:', payload);

      // Sauvegarder les données du formulaire
      const result = await updateReleveCompteursMutation.mutateAsync(payload);
      
      // Obtenir l'ID du relevé (soit existant, soit nouveau)
      const releveId = result?.id || releveCompteurs?.id;
      
      if (!releveId) {
        throw new Error('Impossible de récupérer l\'ID du relevé');
      }

      console.log('✅ Données du formulaire sauvegardées, releveId:', releveId);

      // Upload des nouvelles photos
      await uploadPhotos(releveId);

      // Mettre à jour les descriptions des photos existantes
      const existingPhotos = [...photos.electricite, ...photos.gaz, ...photos.eau]
        .filter(photo => photo.id && !photo.file);

      if (existingPhotos.length > 0) {
        console.log(`📝 Mise à jour des descriptions de ${existingPhotos.length} photos existantes`);
        
        for (const photo of existingPhotos) {
          if (photo.id) {
            const { error } = await supabase
              .from('releve_compteurs_photos')
              .update({ description: photo.description || null })
              .eq('id', photo.id);

            if (error) {
              console.error('❌ Erreur lors de la mise à jour de la description:', error);
            } else {
              console.log(`✅ Description mise à jour pour la photo ${photo.name}`);
            }
          }
        }
      }

      toast.success('Relevé des compteurs sauvegardé avec succès');
      
      // Recharger les données pour mettre à jour l'affichage
      console.log('🔄 Rechargement des données...');
      await refetch();
      
      // Recharger les photos pour afficher les nouvelles photos uploadées
      if (releveId) {
        await loadExistingPhotos(releveId);
      }
      
      console.log('✅ Sauvegarde terminée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
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
    const categoryPhotos = photos[category];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          {icon}
          <h4 className="font-medium">{title}</h4>
          <Badge variant="outline" className="text-xs">
            {categoryPhotos.length} photo{categoryPhotos.length !== 1 ? 's' : ''}
          </Badge>
          {loadingPhotos && (
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Chargement...
            </Badge>
          )}
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
                    disabled={loadingPhotos}
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

            {categoryPhotos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryPhotos.map((photo, index) => (
                  <div key={photo.id || index} className="relative border rounded-lg overflow-hidden bg-white">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('❌ Erreur de chargement de l\'image:', photo.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{photo.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePhoto(category, index)}
                          className="text-red-500 hover:text-red-700 h-5 w-5 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {(photo.size / 1024).toFixed(1)} KB
                        {photo.id && <span className="ml-2 text-green-600">✓ Sauvegardée</span>}
                        {photo.file && <span className="ml-2 text-orange-600">⏳ À sauvegarder</span>}
                      </p>
                      <Input
                        type="text"
                        placeholder="Description"
                        value={photo.description || ''}
                        onChange={(e) => handlePhotoDescriptionChange(category, index, e.target.value)}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Calculer hasErrors ici, en dehors du JSX
  const hasErrors = Object.values(errors).some(error => error !== '');
  // Afficher un badge "Dernier relevé" si des données existent
  const hasExistingData = releveCompteurs && (
    releveCompteurs.nom_ancien_occupant ||
    releveCompteurs.electricite_n_compteur ||
    releveCompteurs.gaz_naturel_n_compteur ||
    releveCompteurs.eau_chaude_m3
  );
  console.log('[ReleveCompteursStep] hasExistingData:', hasExistingData);
  // ...existing code...
  if (isLoading) {
    console.log('[ReleveCompteursStep] isLoading...');
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    console.log('[ReleveCompteursStep] error:', error);
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-red-500">
            <p className="text-sm">Erreur lors du chargement des données</p>
            <Button variant="outline" size="sm" onClick={handleRefreshData} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Main component return
  console.log('[ReleveCompteursStep] Render main form. formData:', formData, 'photos:', photos);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-1">
            Relevé de compteurs
          </Badge>
          Relevé des compteurs
          {hasExistingData && (
            <Badge variant="secondary" className="ml-2">
              Dernier relevé chargé
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations et index de tous les compteurs présents dans le logement
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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
            {releveCompteurs?.nom_ancien_occupant && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernier enregistrement: {releveCompteurs.nom_ancien_occupant}
              </p>
            )}
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
            {releveCompteurs?.electricite_n_compteur && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernier numéro enregistré: {releveCompteurs.electricite_n_compteur}
              </p>
            )}
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
              {releveCompteurs?.electricite_h_pleines && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernier index heures pleines: {releveCompteurs.electricite_h_pleines}
                </p>
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
              {releveCompteurs?.electricite_h_creuses && (
                <p className="text-xs text-muted-foreground mt-1">
                  Dernier index heures creuses: {releveCompteurs.electricite_h_creuses}
                </p>
              )}
            </div>
          </div>

          {/* Photos Électricité */}
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
            {releveCompteurs?.gaz_naturel_n_compteur && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernier numéro gaz: {releveCompteurs.gaz_naturel_n_compteur}
              </p>
            )}
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
            {releveCompteurs?.gaz_naturel_releve && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernier index gaz: {releveCompteurs.gaz_naturel_releve}
              </p>
            )}
          </div>

          {/* Photos Gaz */}
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
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={updateReleveCompteursMutation.isPending || hasErrors || uploadingPhotos}
            className="w-full"
            size="lg"
          >
            {uploadingPhotos ? 'Upload des photos...' : 
              updateReleveCompteursMutation.isPending ? 'Sauvegarde en cours...' : 
              hasExistingData ? 'Mettre à jour le relevé' : 'Enregistrer le relevé'}
          </Button>
          {hasErrors && (
            <p className="text-sm text-red-500 mt-2 text-center">
              Veuillez corriger les erreurs avant de sauvegarder
            </p>
          )}
        </div>

        {/* Note informative */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour le relevé</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Relevez les index au plus près de la date d'entrée/sortie</li>
            <li>• Notez les numéros de compteur pour faciliter les démarches</li>
            <li>• Vérifiez que les compteurs fonctionnent correctement</li>
            <li>• Prenez des photos spécifiques pour chaque type de compteur</li>
            <li>• Photographiez les numéros de série et les index clairement</li>
            <li>• Organisez vos photos par catégorie (électricité, gaz, eau)</li>
            <li>• Les champs vides seront ignorés lors de la sauvegarde</li>
          </ul>
        </div>

        {/* Informations supplémentaires */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">ℹ️ Informations importantes</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Le nom de l'ancien occupant est nécessaire pour le transfert des compteurs</li>
            <li>• Les numéros de compteur sont requis pour identifier les installations</li>
            <li>• Les photos sont organisées par type de compteur pour faciliter les démarches</li>
            <li>• Chaque photo peut être accompagnée d'une description</li>
            <li>• Conservez une copie de ce relevé pour vos démarches administratives</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReleveCompteursStep;