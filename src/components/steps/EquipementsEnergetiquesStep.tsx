import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X, Upload, Image as ImageIcon, Zap, Leaf, Sun } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { StepRef } from '../EtatSortieForm';

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

interface EquipementEnergetiqueData {
  id?: string;
  etat_des_lieux_id: string;
  chauffage_type: string;
  eau_chaude_type: string;
  dpe_classe: string;
  ges_classe: string;
  date_dpe: string;
  presence_panneaux_solaires: boolean;
  type_isolation: string;
  commentaires: string;
  photos: Photo[];
}

interface EquipementsEnergetiquesStepProps {
  etatId: string;
}

const EquipementsEnergetiquesStep = forwardRef<StepRef, EquipementsEnergetiquesStepProps>(({ etatId }, ref) => {
  const { toast } = useToast();
  
  // État local pour simuler les données
  const [isLoading, setIsLoading] = useState(true);
  const [equipementsEnergetiquesData, setEquipementsEnergetiquesData] = useState<EquipementEnergetiqueData | null>(null);
  
  const [formData, setFormData] = useState<Omit<EquipementEnergetiqueData, 'id' | 'etat_des_lieux_id' | 'photos'>>({
    chauffage_type: '',
    eau_chaude_type: '',
    dpe_classe: '',
    ges_classe: '',
    date_dpe: '',
    presence_panneaux_solaires: false,
    type_isolation: '',
    commentaires: '',
  });
  
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options pour les select
  const dpeClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const gesClasses = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const chauffageTypes = [
    'Gaz naturel',
    'Électrique',
    'Fioul',
    'Bois/Granulés',
    'Pompe à chaleur',
    'Géothermie',
    'Solaire',
    'Mixte',
    'Autre'
  ];
  const eauChaudeTypes = [
    'Gaz naturel',
    'Électrique',
    'Fioul',
    'Solaire',
    'Pompe à chaleur',
    'Chaudière mixte',
    'Autre'
  ];

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
          .from('equipements_energetiques')
          .select('*')
          .eq('etat_des_lieux_id', etatId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setEquipementsEnergetiquesData(data);
          const { photos, id, etat_des_lieux_id, ...restData } = data;
          setFormData({
            ...restData,
            date_dpe: restData.date_dpe
              ? new Date(restData.date_dpe).toISOString().split('T')[0]
              : '',
          });
          setExistingPhotos(photos || []);
        } else {
          setEquipementsEnergetiquesData(null);
          setFormData({
            chauffage_type: '',
            eau_chaude_type: '',
            dpe_classe: '',
            ges_classe: '',
            date_dpe: '',
            presence_panneaux_solaires: false,
            type_isolation: '',
            commentaires: '',
          });
          setExistingPhotos([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des données",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (etatId) {
      loadData();
    }
  }, [etatId]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const validFiles: (File & { description?: string })[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: `Fichier ${file.name} trop volumineux (max 5MB)`,
          variant: "destructive"
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: `Fichier ${file.name} n'est pas une image`,
          variant: "destructive"
        });
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
      toast({
        title: "Photo retirée",
        description: "Photo retirée localement. Sauvegardez pour confirmer."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur suppression photo du stockage.",
        variant: "destructive"
      });
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
        const fileName = `${etatId}/equipements_energetiques/${timestamp}_${randomId}.${fileExtension}`;
        
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
          category: 'equipements_energetiques',
          file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur upload: ${error instanceof Error ? error.message : 'Inconnue'}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!etatId) {
      toast({
        title: "Erreur",
        description: "ID de l'état des lieux manquant.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const uploadedPhotos = await uploadPhotos();
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      const dataToSave: EquipementEnergetiqueData = {
        ...formData,
        id: equipementsEnergetiquesData?.id,
        etat_des_lieux_id: etatId,
        photos: allPhotos,
      };

      let savedData;
      if (equipementsEnergetiquesData?.id) {
        // Mise à jour
        const { id, ...updateData } = dataToSave;
        const { data, error } = await supabase
          .from('equipements_energetiques')
          .update(updateData)
          .eq('id', equipementsEnergetiquesData.id)
          .select()
          .single();
          
        if (error) throw error;
        savedData = data;
      } else {
        // Création
        const { id, ...creationData } = dataToSave;
        const { data, error } = await supabase
          .from('equipements_energetiques')
          .insert(creationData)
          .select()
          .single();
          
        if (error) throw error;
        savedData = data;
      }

      setEquipementsEnergetiquesData(savedData);
      setNewPhotos([]);
      toast({
        title: "Succès",
        description: "Équipements énergétiques sauvegardés !"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur sauvegarde: ${error instanceof Error ? error.message : 'Détails dans console'}`,
        variant: "destructive"
      });
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
          Chargement des données énergétiques...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Équipements énergétiques et performance
        </CardTitle>
        <p className="text-sm text-gray-600">
          Renseignez les informations sur la performance énergétique du logement et ses équipements.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section Types d'énergie */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Types d'énergie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chauffage_type" className="font-medium">Type de chauffage</Label>
              <Select value={formData.chauffage_type} onValueChange={(value) => handleInputChange('chauffage_type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner le type de chauffage" />
                </SelectTrigger>
                <SelectContent>
                  {chauffageTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="eau_chaude_type" className="font-medium">Type de production d'eau chaude</Label>
              <Select value={formData.eau_chaude_type} onValueChange={(value) => handleInputChange('eau_chaude_type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner le type d'eau chaude" />
                </SelectTrigger>
                <SelectContent>
                  {eauChaudeTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Section Diagnostic de Performance Énergétique */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-slate-700">Diagnostic de Performance Énergétique (DPE)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dpe_classe" className="font-medium">Classe DPE</Label>
              <Select value={formData.dpe_classe} onValueChange={(value) => handleInputChange('dpe_classe', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Classe A-G" />
                </SelectTrigger>
                <SelectContent>
                  {dpeClasses.map((classe) => (
                    <SelectItem key={classe} value={classe}>
                      Classe {classe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ges_classe" className="font-medium">Classe GES</Label>
              <Select value={formData.ges_classe} onValueChange={(value) => handleInputChange('ges_classe', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Classe A-G" />
                </SelectTrigger>
                <SelectContent>
                  {gesClasses.map((classe) => (
                    <SelectItem key={classe} value={classe}>
                      Classe {classe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date_dpe" className="font-medium">Date du DPE</Label>
              <Input 
                id="date_dpe" 
                type="date" 
                value={formData.date_dpe} 
                onChange={(e) => handleInputChange('date_dpe', e.target.value)} 
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section Énergies renouvelables */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-700">Énergies renouvelables</h3>
          </div>
          <div className="flex items-center space-x-3 mb-3">
            <Checkbox 
              id="presence_panneaux_solaires" 
              checked={formData.presence_panneaux_solaires} 
              onCheckedChange={(checked) => handleInputChange('presence_panneaux_solaires', checked as boolean)}
            />
            <Label htmlFor="presence_panneaux_solaires" className="font-medium cursor-pointer">
              Présence de panneaux solaires (photovoltaïques ou thermiques)
            </Label>
          </div>
        </div>

        {/* Section Isolation */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Isolation</h3>
          <div>
            <Label htmlFor="type_isolation" className="font-medium">Type et état de l'isolation</Label>
            <Input 
              id="type_isolation" 
              value={formData.type_isolation} 
              onChange={(e) => handleInputChange('type_isolation', e.target.value)} 
              placeholder="Ex: Isolation thermique récente, combles isolés, murs non isolés..." 
              className="mt-1"
            />
          </div>
        </div>

        {/* Section Photos */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700">Photos des équipements énergétiques</h3>
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
            <p className="text-xs text-gray-500 mt-1">DPE, panneaux solaires, compteurs, etc.</p>
          </div>

          {existingPhotos.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                    <img 
                      src={photo.url} 
                      alt={photo.name || 'Photo équipement énergétique'} 
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
                  <div key={`new-energetique-${idx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
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
          <Label htmlFor="commentaires_energetiques" className="text-lg font-semibold text-slate-700 mb-3 block">
            Commentaires généraux sur les équipements énergétiques
          </Label>
          <Textarea 
            id="commentaires_energetiques" 
            value={formData.commentaires} 
            onChange={(e) => handleInputChange('commentaires', e.target.value)} 
            placeholder="Observations sur la performance énergétique, travaux d'amélioration recommandés, particularités..." 
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
            {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : 'Sauvegarder les informations énergétiques'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

EquipementsEnergetiquesStep.displayName = 'EquipementsEnergetiquesStep';

export default EquipementsEnergetiquesStep;
