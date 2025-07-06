
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useEquipementsEnergetiquesByEtatId, useUpdateEquipementsEnergetiques, useCreateEquipementsEnergetiques } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Camera, X, Upload, Image as ImageIcon, Leaf, Wind } from 'lucide-react';

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
  category: string; // 'equipements_energetiques'
  file_path: string;
}

interface EquipementEnergetiqueData {
  id?: string;
  etat_des_lieux_id: string;
  chauffage_type: string;
  eau_chaude_type: string;
  dpe_classe: string;
  ges_classe: string;
  date_dpe: string; // YYYY-MM-DD
  presence_panneaux_solaires: boolean;
  type_isolation: string;
  commentaires: string;
  photos: Photo[];
}

interface EquipementsEnergetiquesStepProps {
  etatId: string;
}

const EquipementsEnergetiquesStep: React.FC<EquipementsEnergetiquesStepProps> = ({ etatId }) => {
  const { data: equipementsEnergetiquesData, refetch, isLoading } = useEquipementsEnergetiquesByEtatId(etatId);
  const updateEquipementsEnergetiquesMutation = useUpdateEquipementsEnergetiques();
  const createEquipementsEnergetiquesMutation = useCreateEquipementsEnergetiques();
  
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

  useEffect(() => {
    if (equipementsEnergetiquesData) {
      const { photos, id, etat_des_lieux_id, ...restData } = equipementsEnergetiquesData;
      setFormData({
        ...restData,
        date_dpe: restData.date_dpe ? new Date(restData.date_dpe).toISOString().split('T')[0] : '',
      });
      setExistingPhotos(photos || []);
    } else {
      setFormData({
        chauffage_type: '', eau_chaude_type: '', dpe_classe: '', ges_classe: '',
        date_dpe: '', presence_panneaux_solaires: false, type_isolation: '', commentaires: '',
      });
      setExistingPhotos([]);
    }
  }, [equipementsEnergetiquesData]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.info('Photo retirée. Sauvegardez pour confirmer.');
    } catch (error) { toast.error('Erreur suppression photo du stockage.'); }
  };

  const handleExistingPhotoDescriptionChange = (photoId: string, description: string) => {
    setExistingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
  };

  const _uploadPhotos = async (): Promise<Photo[]> => {
    if (newPhotos.length === 0) return [];
    setUploadingPhotos(true);
    const uploadedResults: Photo[] = [];
    try {
      for (const photoFile of newPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/equipements_energetiques/${timestamp}_${randomId}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('etat-des-lieux-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('etat-des-lieux-photos').getPublicUrl(uploadData!.path);
        uploadedResults.push({
          id: `${timestamp}_${randomId}`, name: photoFile.name, size: photoFile.size, type: photoFile.type,
          url: publicUrlData.publicUrl, description: photoFile.description || '',
          category: 'equipements_energetiques', file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      toast.error(`Erreur upload: ${error instanceof Error ? error.message : 'Inconnue'}`);
      throw error;
    } finally { setUploadingPhotos(false); }
  };

  const handleSave = async () => {
    if (!etatId) { toast.error('ID de l\'état des lieux manquant.'); return; }
    setIsSaving(true);
    try {
      const uploadedPhotosData = await _uploadPhotos();
      const allPhotos = [...existingPhotos, ...uploadedPhotosData];
      const dataToSave: EquipementEnergetiqueData = {
        ...formData,
        id: equipementsEnergetiquesData?.id,
        etat_des_lieux_id: etatId,
        photos: allPhotos,
      };
      if (equipementsEnergetiquesData?.id) {
        await updateEquipementsEnergetiquesMutation.mutateAsync(dataToSave);
      } else {
        const {id, ...creationData} = dataToSave;
        await createEquipementsEnergetiquesMutation.mutateAsync(creationData as Omit<EquipementEnergetiqueData, 'id'>);
      }
      setNewPhotos([]);
      toast.success('Équipements énergétiques sauvegardés !');
      refetch();
    } catch (error) {
      toast.error(`Erreur sauvegarde: ${error instanceof Error ? error.message : 'Détails console'}`);
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mr-3"></div>
          Chargement des informations énergétiques...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-green-600" />
          Performances et équipements énergétiques
        </CardTitle>
        <p className="text-sm text-gray-600">
          Informations sur le DPE, type de chauffage, isolation et autres aspects énergétiques.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Sources d'énergie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chauffage_type" className="font-medium">Type de chauffage principal</Label>
              <Input id="chauffage_type" value={formData.chauffage_type} onChange={(e) => handleInputChange('chauffage_type', e.target.value)} placeholder="Ex: Électrique, Gaz individuel, Fioul" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="eau_chaude_type" className="font-medium">Production d'eau chaude sanitaire</Label>
              <Input id="eau_chaude_type" value={formData.eau_chaude_type} onChange={(e) => handleInputChange('eau_chaude_type', e.target.value)} placeholder="Ex: Cumulus électrique, Chaudière gaz" className="mt-1"/>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Diagnostic de Performance Énergétique (DPE)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dpe_classe" className="font-medium">Classe énergie (DPE)</Label>
              <Input id="dpe_classe" value={formData.dpe_classe} onChange={(e) => handleInputChange('dpe_classe', e.target.value.toUpperCase())} placeholder="Lettre de A à G" maxLength={1} className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="ges_classe" className="font-medium">Classe climat (GES)</Label>
              <Input id="ges_classe" value={formData.ges_classe} onChange={(e) => handleInputChange('ges_classe', e.target.value.toUpperCase())} placeholder="Lettre de A à G" maxLength={1} className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="date_dpe" className="font-medium">Date de réalisation du DPE</Label>
              <Input id="date_dpe" type="date" value={formData.date_dpe} onChange={(e) => handleInputChange('date_dpe', e.target.value)} className="mt-1"/>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Autres équipements & Isolation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 pt-2">
              <Checkbox id="presence_panneaux_solaires" checked={formData.presence_panneaux_solaires} onCheckedChange={(checked) => handleInputChange('presence_panneaux_solaires', checked as boolean)}/>
              <Label htmlFor="presence_panneaux_solaires" className="font-medium cursor-pointer">Présence de panneaux solaires/photovoltaïques</Label>
            </div>
            <div>
              <Label htmlFor="type_isolation" className="font-medium">Type d'isolation observée</Label>
              <Input id="type_isolation" value={formData.type_isolation} onChange={(e) => handleInputChange('type_isolation', e.target.value)} placeholder="Ex: Murs intérieurs, Combles aménagés" className="mt-1"/>
            </div>
          </div>
        </div>

        {/* Section Photos */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Camera className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-700">Photos liées aux aspects énergétiques</h3>
                <Badge variant="secondary">{existingPhotos.length + newPhotos.length} photo(s)</Badge>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploadingPhotos || isSaving}/>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Button type="button" variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); fileInputRef.current?.click();}} disabled={uploadingPhotos || isSaving}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Ajouter des photos
                </Button>
                <p className="text-xs text-gray-500 mt-1">DPE, isolation visible, panneaux solaires, etc.</p>
            </div>

            {existingPhotos.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingPhotos.map((photo) => (
                            <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                                <img src={photo.url} alt={photo.name || 'Photo énergétique'} className="w-full h-28 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} />
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)} className="h-6 w-6 p-0" disabled={isSaving || uploadingPhotos}><X className="h-3 w-3" /></Button>
                                </div>
                                <div className="p-2">
                                    <Input type="text" placeholder="Description" value={photo.description || ''} onChange={(e) => handleExistingPhotoDescriptionChange(photo.id, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving || uploadingPhotos}/>
                                    <p className="text-xs text-gray-500 truncate mt-1" title={photo.name}>{(photo.size / 1024).toFixed(1)} KB <span className="text-green-600">✓</span></p>
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
                                <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveNewPhoto(idx)} className="h-6 w-6 p-0" disabled={isSaving || uploadingPhotos}><X className="h-3 w-3" /></Button>
                                </div>
                                <div className="p-2">
                                    <Input type="text" placeholder="Description" value={photoFile.description || ''} onChange={(e) => handleNewPhotoDescriptionChange(idx, e.target.value)} className="text-xs h-7 w-full" disabled={isSaving || uploadingPhotos}/>
                                    <p className="text-xs text-gray-500 truncate mt-1" title={photoFile.name}>{(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <Label htmlFor="commentaires_energetiques" className="text-lg font-semibold text-slate-700 mb-3 block">Commentaires généraux sur les aspects énergétiques</Label>
          <Textarea id="commentaires_energetiques" value={formData.commentaires} onChange={(e) => handleInputChange('commentaires', e.target.value)} placeholder="Observations sur l'isolation, recommandations, etc." rows={4} className="mt-1"/>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || uploadingPhotos || updateEquipementsEnergetiquesMutation.isPending || createEquipementsEnergetiquesMutation.isPending}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : (updateEquipementsEnergetiquesMutation.isPending || createEquipementsEnergetiquesMutation.isPending ? 'Traitement...' : 'Sauvegarder les informations énergétiques')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipementsEnergetiquesStep;
