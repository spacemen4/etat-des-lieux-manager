import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReleveCompteursByEtatId, useUpdateReleveCompteurs } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Zap, Flame, Droplets, User, Camera, X, Upload, Image as ImageIcon } from 'lucide-react';

interface Photo {
  id?: string;
  file?: File;
  url?: string;
  name: string;
  size: number;
  type: string;
  description?: string;
  category: 'electricite' | 'gaz' | 'eau';
}

interface ReleveCompteursStepProps {
  etatId: string;
}

const ReleveCompteursStep: React.FC<ReleveCompteursStepProps> = ({ etatId }) => {
  const { data: releveCompteurs, refetch, isLoading } = useReleveCompteursByEtatId(etatId);
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

  useEffect(() => {
    if (releveCompteurs) {
      const newFormData = {
        nom_ancien_occupant: releveCompteurs.nom_ancien_occupant || '',
        electricite_n_compteur: releveCompteurs.electricite_n_compteur || '',
        electricite_h_pleines: releveCompteurs.electricite_h_pleines || '',
        electricite_h_creuses: releveCompteurs.electricite_h_creuses || '',
        gaz_naturel_n_compteur: releveCompteurs.gaz_naturel_n_compteur || '',
        gaz_naturel_releve: releveCompteurs.gaz_naturel_releve || '',
        eau_chaude_m3: releveCompteurs.eau_chaude_m3 || '',
        eau_froide_m3: releveCompteurs.eau_froide_m3 || '',
      };
      
      setFormData(newFormData);

      // Charger les photos existantes si elles existent
      if (releveCompteurs.photos) {
        const photosData = typeof releveCompteurs.photos === 'string' 
          ? JSON.parse(releveCompteurs.photos) 
          : releveCompteurs.photos;
        
        if (photosData) {
          setPhotos({
            electricite: photosData.electricite || [],
            gaz: photosData.gaz || [],
            eau: photosData.eau || []
          });
        }
      }
    }
  }, [releveCompteurs]);

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

  const handleRemovePhoto = (category: 'electricite' | 'gaz' | 'eau', index: number) => {
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

const uploadPhotos = async (): Promise<{electricite: Photo[], gaz: Photo[], eau: Photo[]}> => {
  console.log('🚀 Début de l\'upload des photos');
  
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
    console.log('✅ Aucune photo à uploader, retour des photos existantes');
    return photos;
  }

  setUploadingPhotos(true);
  const uploadedPhotos: {electricite: Photo[], gaz: Photo[], eau: Photo[]} = {
    electricite: [],
    gaz: [],
    eau: []
  };

  try {
    // Initialiser avec les photos existantes
    uploadedPhotos.electricite = photos.electricite.filter(photo => !photo.file);
    uploadedPhotos.gaz = photos.gaz.filter(photo => !photo.file);
    uploadedPhotos.eau = photos.eau.filter(photo => !photo.file);

    console.log('📥 Photos existantes conservées:', {
      electricite: uploadedPhotos.electricite.length,
      gaz: uploadedPhotos.gaz.length,
      eau: uploadedPhotos.eau.length
    });

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
      console.log('- File object:', photo.file);

      if (!photo.file) {
        console.log('❌ Pas de fichier pour cette photo, skip');
        continue;
      }

      const formData = new FormData();
      formData.append('file', photo.file);
      formData.append('description', photo.description || '');
      formData.append('category', photo.category);

      console.log('📦 FormData créé:', {
        file: photo.file.name,
        description: photo.description || '',
        category: photo.category
      });

      try {
        console.log('🌐 Envoi de la requête vers /api/upload-photo');
        const startTime = Date.now();
        
        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        const endTime = Date.now();
        console.log(`⏱️ Temps de réponse: ${endTime - startTime}ms`);
        console.log('📡 Réponse reçue:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Vérifier d'abord si la réponse est OK
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erreur HTTP détaillée:');
          console.error('- Status:', response.status);
          console.error('- Status Text:', response.statusText);
          console.error('- Response Text:', errorText);
          console.error('- Headers:', Object.fromEntries(response.headers.entries()));
          
          throw new Error(`Erreur HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }

        // Vérifier le type de contenu
        const contentType = response.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('❌ Réponse non-JSON:', responseText);
          throw new Error('Le serveur a retourné une réponse non-JSON');
        }

        const uploadResult = await response.json();
        console.log('✅ Upload réussi, résultat:', uploadResult);
        
        const uploadedPhoto: Photo = {
          id: uploadResult.id,
          name: photo.name,
          size: photo.size,
          type: photo.type,
          url: uploadResult.url,
          description: photo.description,
          category: photo.category,
        };

        uploadedPhotos[photo.category].push(uploadedPhoto);
        uploadSuccessCount++;
        
        console.log(`✅ Photo ${photo.name} uploadée avec succès dans la catégorie ${photo.category}`);
        
      } catch (photoError) {
        uploadErrorCount++;
        console.error(`❌ Erreur lors de l'upload de ${photo.name}:`, photoError);
        console.error('- Type d\'erreur:', photoError.constructor.name);
        console.error('- Message:', photoError.message);
        console.error('- Stack:', photoError.stack);
        
        toast.error(`Erreur lors de l'upload de ${photo.name}`);
        // Continuer avec les autres photos
      }
    }

    console.log('\n📊 Résumé de l\'upload:');
    console.log('- Succès:', uploadSuccessCount);
    console.log('- Erreurs:', uploadErrorCount);
    console.log('- Total traité:', uploadSuccessCount + uploadErrorCount);
    
    if (uploadErrorCount > 0 && uploadSuccessCount === 0) {
      console.log('❌ Aucune photo uploadée avec succès');
      throw new Error(`Échec de l'upload de toutes les photos (${uploadErrorCount} erreurs)`);
    }

    return uploadedPhotos;
  } catch (error) {
    console.error('💥 Erreur générale lors de l\'upload des photos:', error);
    console.error('- Type d\'erreur:', error.constructor.name);
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    throw error;
  } finally {
    setUploadingPhotos(false);
    console.log('🏁 Fin de l\'upload des photos');
  }
};

// 2. VERSION AVEC SIMULATION D'UPLOAD (pour tester sans serveur)
const uploadPhotosSimulation = async (): Promise<{electricite: Photo[], gaz: Photo[], eau: Photo[]}> => {
  const allPhotos = [...photos.electricite, ...photos.gaz, ...photos.eau];
  const photosToUpload = allPhotos.filter(photo => photo.file);
  
  if (photosToUpload.length === 0) return photos;

  setUploadingPhotos(true);
  const uploadedPhotos: {electricite: Photo[], gaz: Photo[], eau: Photo[]} = {
    electricite: [],
    gaz: [],
    eau: []
  };

  try {
    // Initialiser avec les photos existantes
    uploadedPhotos.electricite = photos.electricite.filter(photo => !photo.file);
    uploadedPhotos.gaz = photos.gaz.filter(photo => !photo.file);
    uploadedPhotos.eau = photos.eau.filter(photo => !photo.file);

    // Simuler l'upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (const photo of photosToUpload) {
      if (!photo.file) continue;

      // Simuler une réponse d'upload réussie
      const uploadedPhoto: Photo = {
        id: `uploaded_${Date.now()}_${Math.random()}`,
        name: photo.name,
        size: photo.size,
        type: photo.type,
        url: photo.url, // Garder l'URL locale pour l'instant
        description: photo.description,
        category: photo.category,
      };

      uploadedPhotos[photo.category].push(uploadedPhoto);
    }

    toast.success('Photos uploadées avec succès (simulation)');
    return uploadedPhotos;
  } catch (error) {
    console.error('Erreur lors de l\'upload des photos:', error);
    throw error;
  } finally {
    setUploadingPhotos(false);
  }
};

// 3. VERSION AVEC FALLBACK LOCAL
const uploadPhotosWithFallback = async (): Promise<{electricite: Photo[], gaz: Photo[], eau: Photo[]}> => {
  const allPhotos = [...photos.electricite, ...photos.gaz, ...photos.eau];
  const photosToUpload = allPhotos.filter(photo => photo.file);
  
  if (photosToUpload.length === 0) return photos;

  setUploadingPhotos(true);
  const uploadedPhotos: {electricite: Photo[], gaz: Photo[], eau: Photo[]} = {
    electricite: [],
    gaz: [],
    eau: []
  };

  try {
    // Initialiser avec les photos existantes
    uploadedPhotos.electricite = photos.electricite.filter(photo => !photo.file);
    uploadedPhotos.gaz = photos.gaz.filter(photo => !photo.file);
    uploadedPhotos.eau = photos.eau.filter(photo => !photo.file);

    for (const photo of photosToUpload) {
      if (!photo.file) continue;

      try {
        // Tenter l'upload réel
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('description', photo.description || '');
        formData.append('category', photo.category);

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Réponse non-JSON');
        }

        const uploadResult = await response.json();
        
        const uploadedPhoto: Photo = {
          id: uploadResult.id,
          name: photo.name,
          size: photo.size,
          type: photo.type,
          url: uploadResult.url,
          description: photo.description,
          category: photo.category,
        };

        uploadedPhotos[photo.category].push(uploadedPhoto);
        
      } catch (uploadError) {
        console.warn(`Upload échoué pour ${photo.name}, sauvegarde en local:`, uploadError);
        
        // Fallback: sauvegarder la photo en local
        const localPhoto: Photo = {
          id: `local_${Date.now()}_${Math.random()}`,
          name: photo.name,
          size: photo.size,
          type: photo.type,
          url: photo.url,
          description: photo.description,
          category: photo.category,
        };

        uploadedPhotos[photo.category].push(localPhoto);
      }
    }

    return uploadedPhotos;
  } catch (error) {
    console.error('Erreur lors de l\'upload des photos:', error);
    throw error;
  } finally {
    setUploadingPhotos(false);
  }
};

// 4. ENDPOINT API EXEMPLE (Next.js)
// pages/api/upload-photo.ts ou app/api/upload-photo/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: './uploads',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Générer un nom de fichier unique
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `${Date.now()}_${Math.random()}${fileExtension}`;
    const filePath = path.join('./uploads', fileName);

    // Déplacer le fichier
    fs.renameSync(file.filepath, filePath);

    // Retourner la réponse JSON
    res.status(200).json({
      id: fileName,
      url: `/uploads/${fileName}`,
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}

// 5. VERSION MODIFIÉE DU COMPOSANT AVEC GESTION D'ERREUR
const handleSave = async () => {
  if (!validateForm()) {
    toast.error('Veuillez corriger les erreurs avant de sauvegarder');
    return;
  }

  try {
    let finalPhotos;
    
    // Choisir la méthode d'upload selon votre configuration
    try {
      finalPhotos = await uploadPhotos(); // Version avec serveur
    } catch (uploadError) {
      console.warn('Upload échoué, sauvegarde sans photos:', uploadError);
      toast.warning('Les photos n\'ont pas pu être uploadées mais les données ont été sauvegardées');
      
      // Sauvegarder sans upload des photos
      finalPhotos = {
        electricite: photos.electricite.filter(photo => !photo.file),
        gaz: photos.gaz.filter(photo => !photo.file),
        eau: photos.eau.filter(photo => !photo.file)
      };
    }

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
      photos: finalPhotos,
    };

    await updateReleveCompteursMutation.mutateAsync(payload);
    toast.success('Relevé des compteurs sauvegardé');
    refetch();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
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
                  <div key={index} className="relative border rounded-lg overflow-hidden bg-white">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
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

  if (isLoading) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-1">
            Relevé de compteurs
          </Badge>
          Relevé des compteurs
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
            <p className="text-xs text-muted-foreground mt-1">
              Nécessaire pour le transfert des compteurs auprès des fournisseurs
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Numéro à 14 chiffres généralement inscrit sur le compteur
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Numéro inscrit sur le compteur gaz
            </p>
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
             'Sauvegarder le relevé'}
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