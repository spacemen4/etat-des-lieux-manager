
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useEquipementsChauffageByEtatId, useUpdateEquipementsChauffage } from '@/hooks/useEtatDesLieux';
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

interface EquipementsChauffageStepProps {
  etatId: string;
}

const EquipementsChauffageStep: React.FC<EquipementsChauffageStepProps> = ({ etatId }) => {
  const { data: equipementsChauffage, refetch, isLoading } = useEquipementsChauffageByEtatId(etatId);
  const updateEquipementsChauffageMutation = useUpdateEquipementsChauffage();
  
  const [newPhotos, setNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (equipementsChauffage) {
      setFormData({
        chaudiere_etat: equipementsChauffage.chaudiere_etat || '',
        chaudiere_date_dernier_entretien: equipementsChauffage.chaudiere_date_dernier_entretien 
          ? new Date(equipementsChauffage.chaudiere_date_dernier_entretien).toISOString().split('T')[0] 
          : '',
        ballon_eau_chaude_etat: equipementsChauffage.ballon_eau_chaude_etat || '',
        radiateurs_nombre: equipementsChauffage.radiateurs_nombre || 0,
        radiateurs_etat: equipementsChauffage.radiateurs_etat || '',
        thermostat_present: equipementsChauffage.thermostat_present || false,
        thermostat_etat: equipementsChauffage.thermostat_etat || '',
        pompe_a_chaleur_present: equipementsChauffage.pompe_a_chaleur_present || false,
        pompe_a_chaleur_etat: equipementsChauffage.pompe_a_chaleur_etat || '',
        commentaires: equipementsChauffage.commentaires || '',
      });
    }
  }, [equipementsChauffage]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
      const fileName = `${etatId}/equipements_chauffage/${timestamp}_${randomId}_${photo.name}`;
      
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
      if (!etatId) {
        toast.error('ID de l\'état des lieux manquant');
        return;
      }

      const uploadedPhotos = await uploadPhotos();
      const existingPhotos = equipementsChauffage?.photos || [];
      const allPhotos = [...existingPhotos, ...uploadedPhotos];

      const dataToSend = {
        etat_des_lieux_id: etatId,
        ...formData,
        photos: allPhotos,
      };

      await updateEquipementsChauffageMutation.mutateAsync(dataToSend);
      setNewPhotos([]);
      toast.success('Équipements de chauffage sauvegardés');
      refetch();
    } catch (error) {
      console.error('Erreur détaillée:', error);
      toast.error('Erreur lors de la sauvegarde des équipements de chauffage');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div>Chargement des équipements de chauffage...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipements de chauffage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chaudière */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Chaudière</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chaudiere_etat">État de la chaudière</Label>
              <Input
                id="chaudiere_etat"
                value={formData.chaudiere_etat}
                onChange={(e) => handleInputChange('chaudiere_etat', e.target.value)}
                placeholder="Ex: Bon état, Défaillante, À réviser..."
              />
            </div>
            <div>
              <Label htmlFor="chaudiere_date_dernier_entretien">Date du dernier entretien</Label>
              <Input
                id="chaudiere_date_dernier_entretien"
                type="date"
                value={formData.chaudiere_date_dernier_entretien}
                onChange={(e) => handleInputChange('chaudiere_date_dernier_entretien', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ballon d'eau chaude */}
        <div>
          <Label htmlFor="ballon_eau_chaude_etat">État du ballon d'eau chaude</Label>
          <Input
            id="ballon_eau_chaude_etat"
            value={formData.ballon_eau_chaude_etat}
            onChange={(e) => handleInputChange('ballon_eau_chaude_etat', e.target.value)}
            placeholder="Ex: Bon état, Défaillant, Fuite détectée..."
          />
        </div>

        {/* Radiateurs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Radiateurs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="radiateurs_nombre">Nombre de radiateurs</Label>
              <Input
                id="radiateurs_nombre"
                type="number"
                value={formData.radiateurs_nombre}
                onChange={(e) => handleInputChange('radiateurs_nombre', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="radiateurs_etat">État général des radiateurs</Label>
              <Input
                id="radiateurs_etat"
                value={formData.radiateurs_etat}
                onChange={(e) => handleInputChange('radiateurs_etat', e.target.value)}
                placeholder="Ex: Bon état, Quelques fuites, À remplacer..."
              />
            </div>
          </div>
        </div>

        {/* Thermostat */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thermostat</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="thermostat_present"
              checked={formData.thermostat_present}
              onCheckedChange={(checked) => handleInputChange('thermostat_present', checked as boolean)}
            />
            <Label htmlFor="thermostat_present">Présence d'un thermostat</Label>
          </div>
          {formData.thermostat_present && (
            <div>
              <Label htmlFor="thermostat_etat">État du thermostat</Label>
              <Input
                id="thermostat_etat"
                value={formData.thermostat_etat}
                onChange={(e) => handleInputChange('thermostat_etat', e.target.value)}
                placeholder="Ex: Fonctionne bien, Défaillant, Programmable..."
              />
            </div>
          )}
        </div>

        {/* Pompe à chaleur */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pompe à chaleur</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="pompe_a_chaleur_present"
              checked={formData.pompe_a_chaleur_present}
              onCheckedChange={(checked) => handleInputChange('pompe_a_chaleur_present', checked as boolean)}
            />
            <Label htmlFor="pompe_a_chaleur_present">Présence d'une pompe à chaleur</Label>
          </div>
          {formData.pompe_a_chaleur_present && (
            <div>
              <Label htmlFor="pompe_a_chaleur_etat">État de la pompe à chaleur</Label>
              <Input
                id="pompe_a_chaleur_etat"
                value={formData.pompe_a_chaleur_etat}
                onChange={(e) => handleInputChange('pompe_a_chaleur_etat', e.target.value)}
                placeholder="Ex: Excellent état, Entretien nécessaire, Bruyante..."
              />
            </div>
          )}
        </div>

        {/* Commentaires */}
        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleInputChange('commentaires', e.target.value)}
            placeholder="Ajoutez vos observations sur les équipements de chauffage..."
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
          disabled={updateEquipementsChauffageMutation.isPending || uploadingPhotos}
          className="w-full"
        >
          {uploadingPhotos ? 'Upload photos...' : updateEquipementsChauffageMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipementsChauffageStep;
