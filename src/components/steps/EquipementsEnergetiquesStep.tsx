import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Upload, Image, Leaf, Wind } from 'lucide-react';

// Configuration Supabase simulée
const SUPABASE_URL = 'https://osqpvyrctlhagtzkbspv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXB2eXJjdGxoYWd0emtic3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg1NjYsImV4cCI6MjA2NjYwNDU2Nn0.4APWILaWXOtXCwdFYTk4MDithvZhp55ZJB6PnVn8D1w';

// Supabase client simulé
const supabase = {
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
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
      remove: async (paths) => {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefixes: paths })
        });
        return { error: response.ok ? null : new Error('Delete failed') };
      },
      getPublicUrl: (path) => ({
        data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` }
      })
    })
  },
  from: (table) => ({
    select: (columns) => ({
      eq: (column, value) => ({
        single: async () => {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}&select=${columns}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
          });
          if (!response.ok && response.status !== 404) throw new Error('Fetch failed');
          const data = await response.json();
          return { data: data.length > 0 ? data[0] : null, error: data.length === 0 ? { code: 'PGRST116' } : null };
        }
      })
    }),
    upsert: (data) => ({
      select: () => ({
        single: async () => {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: { 
              'apikey': SUPABASE_ANON_KEY, 
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error('Upsert failed');
          const result = await response.json();
          return { data: Array.isArray(result) ? result[0] : result, error: null };
        }
      })
    })
  })
};

// Composant principal
const EquipementsEnergetiquesStep = ({ etatId = "demo-etat-123" }) => {
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
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [equipementsEnergetiquesData, setEquipementsEnergetiquesData] = useState(null);
  const fileInputRef = useRef(null);

  // Simulation du hook useEquipementsEnergetiquesByEtatId
  const fetchEquipementsEnergetiques = async (etatId) => {
    setIsLoading(true);
    try {
      const result = await supabase
        .from('equipements_energetiques')
        .select('*')
        .eq('etat_des_lieux_id', etatId)
        .single();
      
      setEquipementsEnergetiquesData(result.data);
      return result.data;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Simulation du hook useUpdateEquipementsEnergetiques
  const updateEquipementsEnergetiques = async (equipements) => {
    try {
      const result = await supabase
        .from('equipements_energetiques')
        .upsert(equipements)
        .select()
        .single();
      
      setEquipementsEnergetiquesData(result.data);
      return result.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  };

  // Simulation du hook useCreateEquipementsEnergetiques
  const createEquipementsEnergetiques = async (equipements) => {
    try {
      const result = await supabase
        .from('equipements_energetiques')
        .upsert(equipements)
        .select()
        .single();
      
      setEquipementsEnergetiquesData(result.data);
      return result.data;
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      throw error;
    }
  };

  // Chargement initial des données
  useEffect(() => {
    if (etatId) {
      fetchEquipementsEnergetiques(etatId);
    }
  }, [etatId]);

  // Mise à jour du formulaire quand les données changent
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

  // Fonction pour afficher les notifications
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
      type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (!files) return;
    const validFiles = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { 
        showNotification(`Fichier ${file.name} trop volumineux (max 5MB)`, 'error'); 
        return; 
      }
      if (!file.type.startsWith('image/')) { 
        showNotification(`Fichier ${file.name} n'est pas une image`, 'error'); 
        return; 
      }
      const fileWithDesc = Object.assign(file, { description: '' });
      validFiles.push(fileWithDesc);
    });
    setNewPhotos(prev => [...prev, ...validFiles]);
  };

  const handleRemoveNewPhoto = (photoIndex) => {
    setNewPhotos(prev => prev.filter((_, index) => index !== photoIndex));
  };

  const handleNewPhotoDescriptionChange = (photoIndex, description) => {
    setNewPhotos(prev => prev.map((photo, i) => i === photoIndex ? { ...photo, description } : photo));
  };

  const handleRemoveExistingPhoto = async (photoId, filePath) => {
    try {
      await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      showNotification('Photo retirée. Sauvegardez pour confirmer.', 'info');
    } catch (error) { 
      showNotification('Erreur suppression photo du stockage.', 'error'); 
    }
  };

  const handleExistingPhotoDescriptionChange = (photoId, description) => {
    setExistingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
  };

  const uploadPhotos = async () => {
    if (newPhotos.length === 0) return [];
    setUploadingPhotos(true);
    const uploadedResults = [];
    try {
      for (const photoFile of newPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/equipements_energetiques/${timestamp}_${randomId}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('etat-des-lieux-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('etat-des-lieux-photos').getPublicUrl(uploadData.path);
        uploadedResults.push({
          id: `${timestamp}_${randomId}`, 
          name: photoFile.name, 
          size: photoFile.size, 
          type: photoFile.type,
          url: publicUrlData.publicUrl, 
          description: photoFile.description || '',
          category: 'equipements_energetiques', 
          file_path: uploadData.path
        });
      }
      return uploadedResults;
    } catch (error) {
      showNotification(`Erreur upload: ${error.message}`, 'error');
      throw error;
    } finally { 
      setUploadingPhotos(false); 
    }
  };

  const handleSave = async () => {
    if (!etatId) { 
      showNotification('ID de l\'état des lieux manquant.', 'error'); 
      return; 
    }
    setIsSaving(true);
    try {
      const uploadedPhotosData = await uploadPhotos();
      const allPhotos = [...existingPhotos, ...uploadedPhotosData];
      const dataToSave = {
        ...formData,
        id: equipementsEnergetiquesData?.id,
        etat_des_lieux_id: etatId,
        photos: allPhotos,
      };
      
      if (equipementsEnergetiquesData?.id) {
        await updateEquipementsEnergetiques(dataToSave);
      } else {
        const {id, ...creationData} = dataToSave;
        await createEquipementsEnergetiques(creationData);
      }
      
      setNewPhotos([]);
      showNotification('Équipements énergétiques sauvegardés !', 'success');
      await fetchEquipementsEnergetiques(etatId);
    } catch (error) {
      showNotification(`Erreur sauvegarde: ${error.message}`, 'error');
    } finally { 
      setIsSaving(false); 
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mr-3"></div>
          Chargement des informations énergétiques...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Performances et équipements énergétiques
          </h1>
        </div>
        <p className="text-sm text-gray-600">
          Informations sur le DPE, type de chauffage, isolation et autres aspects énergétiques.
        </p>
      </div>

      <div className="space-y-8">
        {/* Sources d'énergie */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Sources d'énergie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de chauffage principal
              </label>
              <input
                type="text"
                value={formData.chauffage_type}
                onChange={(e) => handleInputChange('chauffage_type', e.target.value)}
                placeholder="Ex: Électrique, Gaz individuel, Fioul"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Production d'eau chaude sanitaire
              </label>
              <input
                type="text"
                value={formData.eau_chaude_type}
                onChange={(e) => handleInputChange('eau_chaude_type', e.target.value)}
                placeholder="Ex: Cumulus électrique, Chaudière gaz"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* DPE */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Diagnostic de Performance Énergétique (DPE)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe énergie (DPE)
              </label>
              <input
                type="text"
                value={formData.dpe_classe}
                onChange={(e) => handleInputChange('dpe_classe', e.target.value.toUpperCase())}
                placeholder="Lettre de A à G"
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe climat (GES)
              </label>
              <input
                type="text"
                value={formData.ges_classe}
                onChange={(e) => handleInputChange('ges_classe', e.target.value.toUpperCase())}
                placeholder="Lettre de A à G"
                maxLength={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de réalisation du DPE
              </label>
              <input
                type="date"
                value={formData.date_dpe}
                onChange={(e) => handleInputChange('date_dpe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Autres équipements & Isolation */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Autres équipements & Isolation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="presence_panneaux_solaires"
                checked={formData.presence_panneaux_solaires}
                onChange={(e) => handleInputChange('presence_panneaux_solaires', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="presence_panneaux_solaires" className="text-sm font-medium text-gray-700 cursor-pointer">
                Présence de panneaux solaires/photovoltaïques
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'isolation observée
              </label>
              <input
                type="text"
                value={formData.type_isolation}
                onChange={(e) => handleInputChange('type_isolation', e.target.value)}
                placeholder="Ex: Murs intérieurs, Combles aménagés"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section Photos */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700">Photos liées aux aspects énergétiques</h3>
            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
              {existingPhotos.length + newPhotos.length} photo(s)
            </span>
          </div>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
          >
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
            <button
              type="button"
              onClick={(e) => {e.stopPropagation(); fileInputRef.current?.click();}}
              disabled={uploadingPhotos || isSaving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Image className="h-4 w-4 mr-2" /> 
              Ajouter des photos
            </button>
            <p className="text-xs text-gray-500 mt-1">DPE, isolation visible, panneaux solaires, etc.</p>
          </div>

          {existingPhotos.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                    <img 
                      src={photo.url} 
                      alt={photo.name || 'Photo énergétique'} 
                      className="w-full h-28 object-cover" 
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} 
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(photo.id, photo.file_path)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        disabled={isSaving || uploadingPhotos}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={photo.description || ''}
                        onChange={(e) => handleExistingPhotoDescriptionChange(photo.id, e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
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
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(idx)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        disabled={isSaving || uploadingPhotos}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={photoFile.description || ''}
                        onChange={(e) => handleNewPhotoDescriptionChange(idx, e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
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

        {/* Commentaires */}
        <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
          <label className="block text-lg font-semibold text-slate-700 mb-3">
            Commentaires généraux sur les aspects énergétiques
          </label>
          <textarea
            value={formData.commentaires}
            onChange={(e) => handleInputChange('commentaires', e.target.value)}
            placeholder="Observations sur l'isolation, recommandations, etc."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bouton de sauvegarde */}
        <div className="pt-6 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving || uploadingPhotos}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || uploadingPhotos ? 'Sauvegarde en cours...' : 'Sauvegarder les informations énergétiques'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipementsEnergetiquesStep;