
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useEquipementsEnergetiquesByEtatId, useUpdateEquipementsEnergetiques } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Camera, X } from 'lucide-react';

interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  file_path: string;
}

interface EquipementsEnergetiquesStepProps {
  etatId: string;
}

const EquipementsEnergetiquesStep: React.FC<EquipementsEnergetiquesStepProps> = ({ etatId }) => {
  const { data: equipementsEnergetiques, refetch, isLoading, error } = useEquipementsEnergetiquesByEtatId(etatId);
  const updateEquipementsEnergetiquesMutation = useUpdateEquipementsEnergetiques();
  
  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    chauffage_type: '',
    eau_chaude_type: '',
    dpe_classe: '',
    ges_classe: '',
    date_dpe: '',
    presence_panneaux_solaires: false,
    type_isolation: '',
    commentaires: '',
  });

  useEffect(() => {
    if (equipementsEnergetiques) {
      setFormData({
        chauffage_type: equipementsEnergetiques.chauffage_type || '',
        eau_chaude_type: equipementsEnergetiques.eau_chaude_type || '',
        dpe_classe: equipementsEnergetiques.dpe_classe || '',
        ges_classe: equipementsEnergetiques.ges_classe || '',
        date_dpe: equipementsEnergetiques.date_dpe 
          ? new Date(equipementsEnergetiques.date_dpe).toISOString().split('T')[0] 
          : '',
        presence_panneaux_solaires: equipementsEnergetiques.presence_panneaux_solaires || false,
        type_isolation: equipementsEnergetiques.type_isolation || '',
        commentaires: equipementsEnergetiques.commentaires || '',
      });
    }
  }, [equipementsEnergetiques]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const uploadPhotos = async (): Promise<Photo[]> => {
    if (newPhotos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedPhotos: Photo[] = [];

    for (const photo of newPhotos) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${etatId}/equipements_energetiques/${timestamp}_${randomId}_${photo.name}`;
      
      const uploadedPhoto: Photo = {
        id: `${timestamp}_${randomId}`,
        name: photo.name,
        size: photo.size,
        type: photo.type,
        url: `placeholder-url-${fileName}`,
        description: photo.description || '',
        file_path: fileName
      };
      uploadedPhotos.push(uploadedPhoto);
    }

    setUploadingPhotos(false);
    return uploadedPhotos;
  };

  const handleSave = async () => {
    try {
      const uploadedPhotos = await uploadPhotos();
      const existingPhotos = equipementsEnergetiques?.photos || [];
      const allPhotos = [...existingPhotos, ...uploadedPhotos];
      
      const dataToSave = {
        etat_des_lieux_id: etatId,
        ...formData,
        photos: allPhotos,
      };

      await updateEquipementsEnergetiquesMutation.mutateAsync(dataToSave);
      setNewPhotos([]);
      toast.success('Équipements énergétiques sauvegardés');
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Chargement des équipements énergétiques...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements énergétiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chauffage_type">Type de chauffage</Label>
            <Input
              id="chauffage_type"
              value={formData.chauffage_type}
              onChange={(e) => handleInputChange('chauffage_type', e.target.value)}
              placeholder="Ex: Électrique, Gaz, Collectif, Fioul..."
            />
          </div>
          <div>
            <Label htmlFor="eau_chaude_type">Type de production d'eau chaude</Label>
            <Input
              id="eau_chaude_type"
              value={formData.eau_chaude_type}
              onChange={(e) => handleInputChange('eau_chaude_type', e.target.value)}
              placeholder="Ex: Électrique, Gaz, Collectif, Solaire..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dpe_classe">Classe DPE</Label>
            <Input
              id="dpe_classe"
              value={formData.dpe_classe}
              onChange={(e) => handleInputChange('dpe_classe', e.target.value)}
              placeholder="Ex: A, B, C, D, E, F, G"
              maxLength={1}
            />
          </div>
          <div>
            <Label htmlFor="ges_classe">Classe GES</Label>
            <Input
              id="ges_classe"
              value={formData.ges_classe}
              onChange={(e) => handleInputChange('ges_classe', e.target.value)}
              placeholder="Ex: A, B, C, D, E, F, G"
              maxLength={1}
            />
          </div>
          <div>
            <Label htmlFor="date_dpe">Date du DPE</Label>
            <Input
              id="date_dpe"
              type="date"
              value={formData.date_dpe}
              onChange={(e) => handleInputChange('date_dpe', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="presence_panneaux_solaires"
              checked={formData.presence_panneaux_solaires}
              onCheckedChange={(checked) => handleInputChange('presence_panneaux_solaires', checked as boolean)}
            />
            <Label htmlFor="presence_panneaux_solaires">Présence de panneaux solaires</Label>
          </div>
          <div>
            <Label htmlFor="type_isolation">Type d'isolation</Label>
            <Input
              id="type_isolation"
              value={formData.type_isolation}
              onChange={(e) => handleInputChange('type_isolation', e.target.value)}
              placeholder="Ex: Intérieure, Extérieure, Combles..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleInputChange('commentaires', e.target.value)}
            placeholder="Ajoutez vos observations sur les équipements énergétiques..."
            rows={4}
          />
        </div>

        {/* Section Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Photos</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Ajouter photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Nouvelles photos */}
          {newPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {newPhotos.map((photo, photoIndex) => (
                <div key={photoIndex} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={photo.name}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <div className="absolute top-1 right-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemoveNewPhoto(photoIndex)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description..."
                    value={photo.description || ''}
                    className="mt-1 text-xs"
                    onChange={(e) => {
                      const updatedPhotos = [...newPhotos];
                      updatedPhotos[photoIndex] = { ...updatedPhotos[photoIndex], description: e.target.value };
                      setNewPhotos(updatedPhotos);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={updateEquipementsEnergetiquesMutation.isPending || uploadingPhotos || !etatId}
          className="w-full"
        >
          {uploadingPhotos ? 'Upload photos...' : updateEquipementsEnergetiquesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipementsEnergetiquesStep;
