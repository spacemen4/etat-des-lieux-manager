import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Upload, Image as ImageIcon, Flame } from 'lucide-react';
import type { StepRef } from '../EtatSortieForm';

// Configuration Supabase (simulée, adaptez avec votre vraie configuration)
const SUPABASE_URL = 'https://osqpvyrctlhagtzkbspv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXB2eXJjdGxoYWd0emtic3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg1NjYsImV4cCI6MjA2NjYwNDU2Nn0.4APWILaWXOtXCwdFYTk4MDithvZhp55ZJB6PnVn8D1w';

// Simulation des hooks directement dans le composant
const useToast = () => ({
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.error('❌ Error:', message),
  info: (message: string) => console.info('ℹ️ Info:', message),
});

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
  },
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          // Simulation de la récupération des données
          const mockData = {
            id: 'mock-id',
            etat_des_lieux_id: value,
            chaudiere_etat: 'Bon état',
            chaudiere_date_dernier_entretien: '2024-01-15',
            ballon_eau_chaude_etat: 'Correct',
            radiateurs_nombre: 5,
            radiateurs_etat: 'Bon état général',
            thermostat_present: true,
            thermostat_etat: 'Programmable, récent',
            pompe_a_chaleur_present: false,
            pompe_a_chaleur_etat: '',
            commentaires: 'Entretien annuel à prévoir',
            photos: []
          };
          
          // Simule une absence de données pour les nouveaux états
          if (Math.random() > 0.5) {
            return { data: null, error: { code: 'PGRST116' } };
          }
          
          return { data: mockData, error: null };
        }
      })
    }),
    upsert: (data: any) => ({
      select: () => ({
        single: async () => {
          // Simulation de la sauvegarde
          console.log('💾 Sauvegarde simulée:', data);
          return { data: { ...data, id: data.id || 'new-id' }, error: null };
        }
      })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          // Simulation de la création
          console.log('➕ Création simulée:', data);
          return { data: { ...data, id: 'new-id' }, error: null };
        }
      })
    })
  })
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

interface EquipementChauffageData {
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

const EquipementsChauffageStep = forwardRef<StepRef, EquipementsChauffageStepProps>(({ etatId }, ref) => {
  const toast = useToast();
  
  // État local pour simuler les données
  const [isLoading, setIsLoading] = useState(true);
  const [equipementsChauffageData, setEquipementsChauffageData] = useState<EquipementChauffageData | null>(null);
  
  const [formData, setFormData] = useState<Omit<EquipementChauffageData, 'id' | 'etat_des_lieux_id' | 'photos'>>({
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
  });
  
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exposer la fonction de sauvegarde via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveData: handleSave
  }));

  // Simulation du chargement des données
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('equipements_chauffage')
          .select('*')
          .eq('etat_des_lieux_id', etatId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setEquipementsChauffageData(data);
          const { photos, id, etat_des_lieux_id, ...restData } = data;
          setFormData({
            ...restData,
            chaudiere_date_dernier_entretien: restData.chaudiere_date_dernier_entretien
              ? new Date(restData.chaudiere_date_dernier_entretien).toISOString().split('T')[0]
              : '',
          });
          setExistingPhotos(photos || []);
        } else {
          setEquipementsChauffageData(null);
          setFormData({
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
          });
          setExistingPhotos([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    if (etatId) {
      loadData();
    }
  }, [etatId]);

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const validFiles: (File & { description?: string })[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Fichier ${file.name} trop volumineux (max 5MB)`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`Fichier ${file.name} n'est pas une image`);
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
    setNewPhotos(prev => prev.map((photo, i) => i === photoIndex ? { ...photo, description } : photo));
  };

  const handleRemoveExistingPhoto = async (photoId: string, filePath: string) => {
    try {
      await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.info('Photo retirée localement. Sauvegardez pour confirmer.');
    } catch (error) {
      toast.error('Erreur suppression photo du stockage.');
    }
  };

  const handleExistingPhotoDescriptionChange = (photoId: string, description: string) => {
    setExistingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
  };

  const uploadPhotos = async (): Promise<Photo[]> => {
    if (newPhotos.length === 0) return [];
    
    setUploadingPhotos(true);
    const uploadedResults: Photo[] = [];
    
    try {
      for (const photoFile of newPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/equipements_chauffage/${timestamp}_${randomId}.${fileExtension}`;
        
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
          category: 'equipements_chauffage',
          file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      toast.error(`Erreur upload: ${error instanceof Error ? error.message : 'Inconnue'}`);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!etatId) {
      toast.error('ID de l\'état des lieux manquant.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const uploadedPhotos = await uploadPhotos();
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      const dataToSave: EquipementChauffageData = {
        ...formData,
        id: equipementsChauffageData?.id,
        etat_des_lieux_id: etatId,
        photos: allPhotos,
        radiateurs_nombre: Number(formData.radiateurs_nombre) || 0,
      };

      let savedData;
      if (equipementsChauffageData?.id) {
        // Mise à jour
        const { data, error } = await supabase
          .from('equipements_chauffage')
          .upsert(dataToSave)
          .select()
          .single();
          
        if (error) throw error;
        savedData = data;
      } else {
        // Création
        const { id, ...creationData } = dataToSave;
        const { data, error } = await supabase
          .from('equipements_chauffage')
          .insert(creationData)
          .select()
          .single();
          
        if (error) throw error;
        savedData = data;
      }

      setEquipementsChauffageData(savedData);
      setNewPhotos([]);
      toast.success('Équipements de chauffage sauvegardés !');
    } catch (error) {
      toast.error(`Erreur sauvegarde: ${error instanceof Error ? error.message : 'Détails dans console'}`);
      console.error('Erreur de sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Chargement des données de chauffage...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Équipements de chauffage et production d'eau chaude
        </CardTitle>
        <p className="text-sm text-gray-600">
          Décrivez l'état et les caractéristiques des installations de chauffage et d'eau chaude.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section Chaudière */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Chaudière</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chaudiere_etat" className="font-medium">État de la chaudière</Label>
              <Input 
                id="chaudiere_etat" 
                value={formData.chaudiere_etat} 
                onChange={(e) => handleInputChange('chaudiere_etat', e.target.value)} 
                placeholder="Ex: Bon état, traces d'usure" 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="chaudiere_date_dernier_entretien" className="font-medium">Date du dernier entretien</Label>
              <Input 
                id="chaudiere_date_dernier_entretien" 
                type="date" 
                value={formData.chaudiere_date_dernier_entretien} 
                onChange={(e) => handleInputChange('chaudiere_date_dernier_entretien', e.target.value)} 
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section Ballon d'eau chaude */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Ballon d'eau chaude / Cumulus</h3>
          <div>
            <Label htmlFor="ballon_eau_chaude_etat" className="font-medium">État du ballon</Label>
            <Input 
              id="ballon_eau_chaude_etat" 
              value={formData.ballon_eau_chaude_etat} 
              onChange={(e) => handleInputChange('ballon_eau_chaude_etat', e.target.value)} 
              placeholder="Ex: Bon état, récent, ancien" 
              className="mt-1"
            />
          </div>
        </div>

        {/* Section Radiateurs */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Radiateurs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="radiateurs_nombre" className="font-medium">Nombre de radiateurs</Label>
              <Input 
                id="radiateurs_nombre" 
                type="number" 
                value={formData.radiateurs_nombre} 
                onChange={(e) => handleInputChange('radiateurs_nombre', parseInt(e.target.value) || 0)} 
                min="0" 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="radiateurs_etat" className="font-medium">État général des radiateurs</Label>
              <Input 
                id="radiateurs_etat" 
                value={formData.radiateurs_etat} 
                onChange={(e) => handleInputChange('radiateurs_etat', e.target.value)} 
                placeholder="Ex: Bon état, quelques rayures" 
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section Thermostat */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Thermostat</h3>
          <div className="flex items-center space-x-3 mb-3">
            <Checkbox 
              id="thermostat_present" 
              checked={formData.thermostat_present} 
              onCheckedChange={(checked) => handleInputChange('thermostat_present', checked as boolean)}
            />
            <Label htmlFor="thermostat_present" className="font-medium cursor-pointer">
              Présence d'un thermostat d'ambiance
            </Label>
          </div>
          {formData.thermostat_present && (
            <div>
              <Label htmlFor="thermostat_etat" className="font-medium">État et type du thermostat</Label>
              <Input 
                id="thermostat_etat" 
                value={formData.thermostat_etat} 
                onChange={(e) => handleInputChange('thermostat_etat', e.target.value)} 
                placeholder="Ex: Programmable, connecté, bon état" 
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Section Pompe à chaleur */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Pompe à chaleur (si applicable)</h3>
          <div className="flex items-center space-x-3 mb-3">
            <Checkbox 
              id="pompe_a_chaleur_present" 
              checked={formData.pompe_a_chaleur_present} 
              onCheckedChange={(checked) => handleInputChange('pompe_a_chaleur_present', checked as boolean)}
            />
            <Label htmlFor="pompe_a_chaleur_present" className="font-medium cursor-pointer">
              Présence d'une pompe à chaleur
            </Label>
          </div>
          {formData.pompe_a_chaleur_present && (
            <div>
              <Label htmlFor="pompe_a_chaleur_etat" className="font-medium">État de la pompe à chaleur</Label>
              <Input 
                id="pompe_a_chaleur_etat" 
                value={formData.pompe_a_chaleur_etat} 
                onChange={(e) => handleInputChange('pompe_a_chaleur_etat', e.target.value)} 
                placeholder="Ex: Bon état, modèle récent" 
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Section Photos */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700">Photos des équipements de chauffage</h3>
            <Badge variant="secondary">{existingPhotos.length + newPhotos.length} photo(s)</Badge>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" 
               onClick={() => fileInputRef.current?.click()}>
            <input 
              ref={fileInputRef} 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileSelect} 
              className="hidden" 
              disabled={uploadingPhotos || isSaving}
            />
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={(e) => {e.stopPropagation(); fileInputRef.current?.click();}} 
              disabled={uploadingPhotos || isSaving}
            >
              <ImageIcon className="h-4 w-4 mr-2" /> 
              Ajouter des photos
            </Button>
            <p className="text-xs text-gray-500 mt-1">Chaudière, radiateurs, thermostat, etc.</p>
          </div>

          {existingPhotos.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                    <img 
                      src={photo.url} 
                      alt={photo.name || 'Photo chauffage'} 
                      className="w-full h-28 object-cover" 
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} 
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)} 
                        className="h-6 w-6 p-0" 
                        disabled={isSaving || uploadingPhotos}
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
                        disabled={isSaving || uploadingPhotos} 
                      />
                      <p className="text-xs text-gray-500 truncate mt-1" title={photo.name}>
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
              <h4 className="text-sm font-medium text-gray-600">Nouvelles photos :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {newPhotos.map((photoFile, idx) => (
                  <div key={`new-chauffage-${idx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                    <img 
                      src={URL.createObjectURL(photoFile)} 
                      alt={photoFile.name} 
                      className="w-full h-28 object-cover" 
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleRemoveNewPhoto(idx)} 
                        className="h-6 w-6 p-0" 
                        disabled={isSaving || uploadingPhotos}
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
                        disabled={isSaving || uploadingPhotos} 
                      />
                      <p className="text-xs text-gray-500 truncate mt-1" title={photoFile.name}>
                        {(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commentaires Généraux */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <Label htmlFor="commentaires_chauffage" className="text-lg font-semibold text-slate-700 mb-3 block">
            Commentaires généraux sur le chauffage
          </Label>
          <Textarea 
            id="commentaires_chauffage" 
            value={formData.commentaires} 
            onChange={(e) => handleInputChange('commentaires', e.target.value)} 
            placeholder="Observations globales, conseils d'utilisation, dysfonctionnements signalés..." 
            rows={4} 
            className="mt-1"
          />
        </div>

        <div className="mt-8 pt-6 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || uploadingPhotos}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : 'Sauvegarder les informations de chauffage'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

EquipementsChauffageStep.displayName = 'EquipementsChauffageStep';

export default EquipementsChauffageStep;