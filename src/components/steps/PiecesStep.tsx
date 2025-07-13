import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Home, Camera, Upload, Image as ImageIcon, X } from 'lucide-react';

const SUPABASE_URL = 'https://osqpvyrctlhagtzkbspv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXB2eXJjdGxoYWd0emtic3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg1NjYsImV4cCI6MjA2NjYwNDU2Nn0.4APWILaWXOtXCwdFYTk4MDithvZhp55ZJB6PnVn8D1w';

// Configuration Supabase réelle
const supabaseClient = {
  // Fonction pour faire des requêtes à l'API Supabase
  async apiCall(endpoint: string, options: any = {}) {
    console.log('[DEBUG] apiCall: endpoint', endpoint);
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    console.log('[DEBUG] apiCall: url', url);
    console.log('[DEBUG] apiCall: options', JSON.parse(JSON.stringify(options))); // Deep copy for logging
    const headers: Record<string, string> = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    console.log('[DEBUG] apiCall: response status', response.status);
    console.log('[DEBUG] apiCall: response statusText', response.statusText);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
        console.log('[DEBUG] apiCall: errorData from json()', errorData);
      } catch (e) {
        console.log('[DEBUG] apiCall: failed to parse error response as JSON', e);
        errorData.message = response.statusText; // Fallback message
      }
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    // For POST, PATCH, DELETE with 'return=representation', Supabase returns an array.
    // For GET (list), it's an array. For GET (single with ?id=eq.x), it might be an array with one item.
    // We'll adjust this to be more flexible or ensure callers expect an array.
    const responseData = await response.json();
    // console.log('[DEBUG] apiCall: responseData', responseData);
    return responseData;
  },

  // Opérations sur les pièces
  pieces: {
    async fetchAll(etatId) {
      // Assuming pieces table might have a 'photos' column as JSONB
      return await supabaseClient.apiCall(`pieces?etat_des_lieux_id=eq.${etatId}&select=*,photos`);
    },

    async create(piece) {
      // Ensure 'photos' is part of the piece object if it's being created with photos
      const [result] = await supabaseClient.apiCall('pieces', {
        method: 'POST',
        body: JSON.stringify(piece)
      });
      return result;
    },

    async update(id, updates) {
      // Ensure 'photos' is part of the updates object if photos are being changed
      const [result] = await supabaseClient.apiCall(`pieces?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return result;
    },

    async delete(id) {
      await supabaseClient.apiCall(`pieces?id=eq.${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Opérations sur les photos
  // Opérations sur le stockage
  storage: {
    from: (bucket) => ({
      async upload(path, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Upload Error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return { data: { path }, error: null };
      },

      async remove(paths) {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prefixes: paths })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Delete Error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return { error: null };
      },

      getPublicUrl: (path) => ({
        data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}` }
      })
    })
  }
};

// Interface for Photo metadata (similar to ReleveCompteursStep)
interface PhotoMetadata {
  id: string; // Unique ID for the photo (e.g., timestamp_randomId or file_path)
  name: string;
  size: number;
  type: string;
  url: string;
  description?: string;
  category: string; // e.g., 'pieces'
  file_path: string; // Path in Supabase storage
}

const PIECES_TYPES = [
  'Salon', 'Cuisine', 'Chambre', 'Salle de bain', 'WC', 'Entrée', 'Couloir',
  'Bureau', 'Dressing', 'Cellier', 'Garage', 'Cave', 'Grenier', 'Balcon',
  'Terrasse', 'Jardin', 'Buanderie', 'Salle à manger'
];

const PIECES_SUGGESTIONS = {
  'Salon': ['Salon', 'Séjour', 'Salon/Salle à manger'],
  'Cuisine': ['Cuisine', 'Kitchenette', 'Cuisine équipée'],
  'Chambre': ['Chambre 1', 'Chambre 2', 'Chambre principale', 'Chambre parentale'],
  'Salle de bain': ['Salle de bain', 'Salle d\'eau', 'Salle de bain principale'],
  'WC': ['WC', 'Toilettes', 'WC séparés'],
  'Entrée': ['Entrée', 'Hall d\'entrée', 'Vestibule'],
  'Couloir': ['Couloir', 'Dégagement', 'Palier'],
  'Bureau': ['Bureau', 'Espace de travail', 'Coin bureau'],
  'Dressing': ['Dressing', 'Penderie', 'Armoire'],
  'Cellier': ['Cellier', 'Débarras', 'Rangement'],
  'Garage': ['Garage', 'Parking', 'Box'],
  'Cave': ['Cave', 'Sous-sol', 'Local technique'],
  'Grenier': ['Grenier', 'Combles', 'Mansarde'],
  'Balcon': ['Balcon', 'Loggia', 'Terrasse couverte'],
  'Terrasse': ['Terrasse', 'Patio', 'Cour'],
  'Jardin': ['Jardin', 'Espace vert', 'Cour'],
  'Buanderie': ['Buanderie', 'Lingerie', 'Espace linge'],
  'Salle à manger': ['Salle à manger', 'Coin repas', 'Espace repas']
};

const PIECE_FIELD_CONFIG = {
  'Salon': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries', 'chauffage_tuyauterie'],
  'Cuisine': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries', 'eviers_robinetterie', 'meubles_cuisine', 'hotte', 'plaque_cuisson'],
  'Chambre': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries', 'placards', 'chauffage_tuyauterie'],
  'Salle de bain': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'sanitaires', 'baignoire_douche', 'eviers_robinetterie', 'chauffage_tuyauterie'],
  'WC': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'sanitaires'],
  'Entrée': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries', 'placards'],
  'Couloir': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'placards'],
  'Bureau': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries', 'chauffage_tuyauterie'],
  'Dressing': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'rangements'],
  'Cellier': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'rangements'],
  'Garage': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries'],
  'Cave': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie'],
  'Grenier': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie'],
  'Balcon': ['revetements_sols', 'murs_menuiseries', 'menuiseries'],
  'Terrasse': ['revetements_sols', 'murs_menuiseries'],
  'Jardin': [],
  'Buanderie': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'eviers_robinetterie', 'rangements'],
  'Salle à manger': ['revetements_sols', 'murs_menuiseries', 'plafond', 'electricite_plomberie', 'menuiseries', 'chauffage_tuyauterie']
};

const getFieldsForPiece = (pieceName) => {
  const pieceType = PIECES_TYPES.find(type => 
    pieceName.toLowerCase().includes(type.toLowerCase()) || 
    PIECES_SUGGESTIONS[type]?.some(suggestion => 
      pieceName.toLowerCase().includes(suggestion.toLowerCase())
    )
  );
  
  return PIECE_FIELD_CONFIG[pieceType || 'Salon'] || [];
};

const PiecesStep = ({ etatId = 'demo-etat' }) => {
  const [pieces, setPieces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPieceNewPhotos, setCurrentPieceNewPhotos] = useState([]);
  const [currentPieceExistingPhotos, setCurrentPieceExistingPhotos] = useState([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Simulation d'un toast - vous pouvez intégrer une vraie librairie de toast
    const alertType = type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : 'Info';
    alert(`${alertType}: ${message}`);
  };

  // Chargement initial des pièces depuis Supabase
  useEffect(() => {
    const loadPieces = async () => {
      try {
        setIsLoading(true);
        // piecesData should now include the 'photos' array directly if the 'pieces' table has it.
        const piecesData = await supabaseClient.pieces.fetchAll(etatId);
        
        // Ensure each piece has a 'photos' array, even if null from DB, default to empty array.
        const piecesWithInitializedPhotos = piecesData.map(p => ({
          ...p,
          photos: p.photos || []
        }));
        
        setPieces(piecesWithInitializedPhotos);
      } catch (error) {
        console.error('Erreur chargement pièces:', error);
        showToast('Erreur lors du chargement des pièces', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadPieces();
  }, [etatId]);

  useEffect(() => {
    if (selectedPiece) {
      // Assuming selectedPiece from `pieces` state already has `photos` array
      const { id, etat_des_lieux_id, nom_piece, photos, created_at, updated_at, ...restData } = selectedPiece;
      setFormData(restData);
      setCurrentPieceExistingPhotos(photos || []); // photos is PhotoMetadata[]
      setCurrentPieceNewPhotos([]);
    } else {
      setFormData({});
      setCurrentPieceExistingPhotos([]);
      setCurrentPieceNewPhotos([]);
    }
  }, [selectedPiece]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelectCurrentPiece = (event) => {
    const files = event.target.files;
    if (!files || !selectedPiece) return;
    
    const validFiles = [];
    Array.from(files).forEach((file: File) => {
      if (file.size > 5 * 1024 * 1024) { 
        showToast(`Fichier ${file.name} trop volumineux (max 5MB)`, 'error'); 
        return; 
      }
      if (!file.type.startsWith('image/')) { 
        showToast(`Fichier ${file.name} n'est pas une image`, 'error'); 
        return; 
      }
      const fileWithDesc = file as any;
      fileWithDesc.description = '';
      validFiles.push(fileWithDesc);
    });
    
    setCurrentPieceNewPhotos(prev => [...prev, ...validFiles]);
  };

  const handleRemoveNewPhotoCurrentPiece = (photoIndex) => {
    setCurrentPieceNewPhotos(prev => prev.filter((_, index) => index !== photoIndex));
  };

  const handleNewPhotoDescriptionChangeCurrentPiece = (photoIndex, description) => {
    setCurrentPieceNewPhotos(prev => prev.map((photo, i) => i === photoIndex ? { ...photo, description } : photo));
  };

  const handleRemoveExistingPhotoCurrentPiece = async (photoId, filePath) => {
    if (!selectedPiece) return;
    
    setIsProcessingPhotos(true);
    try {
      // Supprimer du stockage
      await supabaseClient.storage.from('etat-des-lieux-photos').remove([filePath]);
      
      // Mettre à jour l'état local (la sauvegarde mettra à jour la BD)
      const updatedPhotos = currentPieceExistingPhotos.filter(p => p.id !== photoId);
      setCurrentPieceExistingPhotos(updatedPhotos);
      
      // Mettre à jour la pièce sélectionnée pour refléter la suppression de la photo
      // et déclencher la sauvegarde pour persister ce changement.
      if (selectedPiece) {
        const pieceUpdateWithRemovedPhoto = { ...selectedPiece, photos: updatedPhotos };
        setSelectedPiece(pieceUpdateWithRemovedPhoto);
        // Optionnel: sauvegarder immédiatement la pièce avec la liste de photos mise à jour
        // await supabaseClient.pieces.update(selectedPiece.id, { photos: updatedPhotos });
        // Pour l'instant, on laisse la sauvegarde principale gérer ça via handleSave.
      }
      
      showToast('Photo marquée pour suppression. Sauvegardez la pièce pour confirmer.', 'info');
    } catch (error) {
      console.error('Erreur suppression photo du stockage:', error);
      showToast('Erreur lors de la suppression du fichier photo du stockage.', 'error');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleExistingPhotoDescriptionChangeCurrentPiece = (photoId, description) => {
    setCurrentPieceExistingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
    // Note: This change will be persisted when the piece is saved.
  };

  // _uploadPhotosForCurrentPiece now returns an array of PhotoMetadata
  const _uploadPhotosForCurrentPiece = async (): Promise<PhotoMetadata[]> => {
    if (currentPieceNewPhotos.length === 0 || !selectedPiece) return [];
    
    setIsProcessingPhotos(true);
    const uploadedPhotoMetadataList: PhotoMetadata[] = [];
    
    try {
      for (const photoFile of currentPieceNewPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const photoInternalId = `${timestamp}_${randomId}`; // Used for React keys and local ID
        const fileExtension = photoFile.name.split('.').pop();
        // Ensure selectedPiece.id is valid, otherwise, this might be an issue if piece not yet saved
        const pieceIdForPath = selectedPiece.id || "unknown_piece";
        const fileName = `${etatId}/pieces/${pieceIdForPath}/${photoInternalId}.${fileExtension}`;
        
        console.log('[DEBUG] _uploadPhotosForCurrentPiece: Uploading to Supabase Storage path:', fileName);
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('etat-des-lieux-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) throw uploadError;
        
        console.log('[DEBUG] _uploadPhotosForCurrentPiece: Getting public URL...');
        const { data: publicUrlData } = supabaseClient.storage
          .from('etat-des-lieux-photos')
          .getPublicUrl(uploadData.path);
        
        const photoMetadata: PhotoMetadata = {
          id: photoInternalId, // Use the generated ID
          name: photoFile.name,
          size: photoFile.size,
          type: photoFile.type,
          url: publicUrlData.publicUrl,
          description: photoFile.description || '',
          category: 'pieces',
          file_path: uploadData.path
        };
        uploadedPhotoMetadataList.push(photoMetadata);
        console.log('[DEBUG] _uploadPhotosForCurrentPiece: Generated photo metadata:', photoMetadata);
      }
      
      console.log('[DEBUG] _uploadPhotosForCurrentPiece: All photos processed, metadata list:', uploadedPhotoMetadataList);
      return uploadedPhotoMetadataList;
    } catch (error) {
      console.error('Erreur upload photos:', error);
      showToast(`Erreur upload photos: ${error.message}`, 'error');
      throw error;
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPiece) return;
    
    setIsSaving(true);
    
    try {
      // 1. Upload des nouvelles photos et obtenir leurs métadonnées
      const newPhotoMetadataList = await _uploadPhotosForCurrentPiece();
      
      // 2. Combiner les photos existantes (avec leurs descriptions potentiellement mises à jour)
      //    et les métadonnées des nouvelles photos.
      //    currentPieceExistingPhotos already reflects description changes.
      const allPhotosForPiece: PhotoMetadata[] = [
        ...currentPieceExistingPhotos,
        ...newPhotoMetadataList
      ];

      // 3. Préparer les données de la pièce à sauvegarder, y compris le tableau de photos.
      const pieceDataToSave = {
        ...formData, // Contient les autres champs de la pièce
        photos: allPhotosForPiece, // Le tableau complet des métadonnées des photos
      };
      
      // 4. Mettre à jour la pièce dans la base de données
      console.log('[DEBUG] handleSave: Updating piece with data:', pieceDataToSave);
      const updatedPieceFromDB = await supabaseClient.pieces.update(selectedPiece.id, pieceDataToSave);
      
      // 5. Mettre à jour l'état local
      //    updatedPieceFromDB should ideally return the piece with the photos array included.
      //    If not, ensure updatedPieceFromDB is merged correctly with allPhotosForPiece for local state.
      const finalUpdatedPieceForState = { ...updatedPieceFromDB, photos: allPhotosForPiece };

      setPieces(prevPieces => prevPieces.map(p =>
        p.id === selectedPiece.id ? finalUpdatedPieceForState : p
      ));
      
      setSelectedPiece(finalUpdatedPieceForState);
      setCurrentPieceNewPhotos([]);
      
      showToast(`Pièce "${selectedPiece.nom_piece}" sauvegardée avec succès`, 'success');
    } catch (error) {
      console.error('Erreur sauvegarde pièce:', error);
      showToast('Erreur lors de la sauvegarde de la pièce', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePiece = async () => {
    if (!newPieceName.trim()) {
      showToast('Veuillez saisir un nom de pièce', 'error');
      return;
    }

    setIsCreating(true);

    try {
      const newPieceData = {
        etat_des_lieux_id: etatId,
        nom_piece: newPieceName.trim(),
        photos: [], // Initialize with an empty array for photos
      };
      const newPiece = await supabaseClient.pieces.create(newPieceData);

      // newPiece should already have the 'photos' array from the DB response if 'return=representation'
      setPieces(prev => [...prev, newPiece]);

      showToast(`Pièce "${newPieceName}" créée avec succès`, 'success');
      setNewPieceName('');
      setSelectedSuggestion('');
      setIsCreateDialogOpen(false);
      setSelectedPiece(newPiece);
    } catch (error) {
      console.error('Erreur création pièce:', error);
      showToast('Erreur lors de la création de la pièce', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setNewPieceName(suggestion);
  };

  const handleDeletePiece = async (pieceId, pieceName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la pièce "${pieceName}" et toutes ses données associées (y compris les photos) ? Cette action est irréversible.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const pieceToDelete = pieces.find(p => p.id === pieceId);
      
      // Supprimer les photos du stockage si elles existent
      if (pieceToDelete?.photos && pieceToDelete.photos.length > 0) {
        const photoPaths = pieceToDelete.photos.map(p => p.file_path).filter(Boolean); // Ensure paths are valid
        if (photoPaths.length > 0) {
          try {
            console.log('[DEBUG] handleDeletePiece: Removing photos from storage:', photoPaths);
            await supabaseClient.storage.from('etat-des-lieux-photos').remove(photoPaths);
          } catch (storageError) {
            console.error("Erreur suppression photos du stockage lors de la suppression de la pièce:", storageError);
            showToast('Erreur partielle: certaines photos du stockage n\'ont pu être supprimées.', 'error');
            // Continue with deleting the piece record itself
          }
        }
      }

      // Supprimer la pièce de la base de données
      // (cela supprimera la pièce et sa colonne 'photos' contenant les métadonnées)
      console.log('[DEBUG] handleDeletePiece: Deleting piece record from DB:', pieceId);
      await supabaseClient.pieces.delete(pieceId);
      
      // Mettre à jour l'état local
      setPieces(prev => prev.filter(piece => piece.id !== pieceId));
      
      if (selectedPiece && selectedPiece.id === pieceId) {
        setSelectedPiece(null);
      }

      showToast(`Pièce "${pieceName}" supprimée avec succès`, 'success');
    } catch (error) {
      console.error('Erreur suppression pièce:', error);
      showToast(`Erreur lors de la suppression de la pièce: ${error.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderPieceFields = () => {
    if (!selectedPiece) return null;
    
    const fields = getFieldsForPiece(selectedPiece.nom_piece);
    const fieldLabels = {
      'revetements_sols': 'Revêtements de sols (état à l\'entrée)',
      'murs_menuiseries': 'Murs et menuiseries (état à l\'entrée)',
      'plafond': 'Plafond (état à l\'entrée)',
      'electricite_plomberie': 'Électricité et plomberie (état à l\'entrée)',
      'placards': 'Placards (état à l\'entrée)',
      'sanitaires': 'Sanitaires (état à l\'entrée)',
      'menuiseries': 'Menuiseries (état à l\'entrée)',
      'rangements': 'Rangements (état à l\'entrée)',
      'baignoire_douche': 'Baignoire/Douche (état à l\'entrée)',
      'eviers_robinetterie': 'Éviers et robinetterie (état à l\'entrée)',
      'chauffage_tuyauterie': 'Chauffage et tuyauterie (état à l\'entrée)',
      'meubles_cuisine': 'Meubles de cuisine (état à l\'entrée)',
      'hotte': 'Hotte (état à l\'entrée)',
      'plaque_cuisson': 'Plaque de cuisson (état à l\'entrée)'
    };

    return (
      <div className="space-y-4">
        {fields.map((field) => {
          const fieldKey = field;
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{fieldLabels[field] || field}</Label>
              <Textarea
                id={fieldKey}
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                placeholder={`Décrivez l'état des ${fieldLabels[field]?.toLowerCase() || field}`}
                className="min-h-[80px]"
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des pièces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Pièces de l'état des lieux (état à l'entrée)
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une pièce
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle pièce</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="piece-name">Nom de la pièce</Label>
                  <Input
                    id="piece-name"
                    value={newPieceName}
                    onChange={(e) => setNewPieceName(e.target.value)}
                    placeholder="Ex: Salon, Cuisine, Chambre 1..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Ou choisir parmi les suggestions :</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PIECES_TYPES.map((type) => (
                      <div key={type} className="space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionSelect(type)}
                          className="w-full text-left justify-start"
                        >
                          {type}
                        </Button>
                        {selectedSuggestion === type && PIECES_SUGGESTIONS[type] && (
                          <div className="ml-2 space-y-1">
                            {PIECES_SUGGESTIONS[type].map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuggestionSelect(suggestion)}
                                className="w-full text-left justify-start text-xs"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreatePiece}
                    disabled={!newPieceName.trim() || isCreating}
                  >
                    {isCreating ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {pieces.length === 0 ? (
            <div className="text-center py-8">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune pièce ajoutée</h3>
              <p className="text-gray-500 mb-4">Commencez par ajouter les pièces de votre état des lieux</p>
              <p className="text-sm text-gray-400">Cliquez sur "Ajouter une pièce" pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pieces.map((piece) => (
                <div key={piece.id} className="flex gap-1">
                  <Button
                    variant={selectedPiece?.id === piece.id ? "default" : "outline"}
                    onClick={() => setSelectedPiece(piece)}
                    className="text-sm justify-start flex-grow"
                  >
                    <Edit className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{piece.nom_piece}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-red-500 hover:text-red-700"
                    onClick={(e) => { e.stopPropagation(); handleDeletePiece(piece.id, piece.nom_piece); }}
                    disabled={isDeleting}
                    title={`Supprimer ${piece.nom_piece}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPiece && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                {selectedPiece.nom_piece} (état à l'entrée)
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeletePiece(selectedPiece.id, selectedPiece.nom_piece)}
                className="text-red-500 hover:text-red-700"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer cette pièce
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {renderPieceFields()}

              <div className="p-4 border rounded-lg bg-slate-50 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-700">Photos pour {selectedPiece.nom_piece} (état à l'entrée)</h3>
                  <Badge variant="secondary">{currentPieceExistingPhotos.length + currentPieceNewPhotos.length} photo(s)</Badge>
                </div>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" 
                  onClick={() => !(isProcessingPhotos || isSaving) && fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileSelectCurrentPiece} 
                    className="hidden" 
                    disabled={isProcessingPhotos || isSaving}
                  />
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {e.stopPropagation(); !(isProcessingPhotos || isSaving) && fileInputRef.current?.click();}} 
                    disabled={isProcessingPhotos || isSaving}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" /> Ajouter des photos
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB par image.</p>
                </div>

                {currentPieceExistingPhotos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Photos sauvegardées :</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {currentPieceExistingPhotos.map((photo) => (
                        <div key={photo.id} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
                          <img 
                            src={photo.url} 
                            alt={photo.name || `Photo ${selectedPiece.nom_piece}`} 
                            className="w-full h-28 object-cover" 
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} 
                          />
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => handleRemoveExistingPhotoCurrentPiece(photo.id, photo.file_path)} 
                              className="h-6 w-6 p-0" 
                              disabled={isProcessingPhotos || isSaving}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="p-2">
                            <Input 
                              type="text" 
                              placeholder="Description" 
                              value={photo.description || ''} 
                              onChange={(e) => handleExistingPhotoDescriptionChangeCurrentPiece(photo.id, e.target.value)} 
                              className="text-xs h-7 w-full" 
                              disabled={isProcessingPhotos || isSaving}
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

                {currentPieceNewPhotos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Nouvelles photos :</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {currentPieceNewPhotos.map((photoFile, idx) => (
                        <div key={`new-piece-${selectedPiece.id}-photo-${idx}`} className="relative border rounded-lg overflow-hidden bg-white shadow-sm group">
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
                              onClick={() => handleRemoveNewPhotoCurrentPiece(idx)} 
                              className="h-6 w-6 p-0" 
                              disabled={isProcessingPhotos || isSaving}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="p-2">
                            <Input 
                              type="text" 
                              placeholder="Description" 
                              value={photoFile.description || ''} 
                              onChange={(e) => handleNewPhotoDescriptionChangeCurrentPiece(idx, e.target.value)} 
                              className="text-xs h-7 w-full" 
                              disabled={isProcessingPhotos || isSaving}
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

              <div className="mt-6 space-y-2">
                <Label htmlFor="commentaires">Commentaires généraux (état à l'entrée)</Label>
                <Textarea
                  id="commentaires"
                  value={formData.commentaires || ''}
                  onChange={(e) => handleInputChange('commentaires', e.target.value)}
                  placeholder="Ajoutez des commentaires généraux sur cette pièce..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2 pt-6 mt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isProcessingPhotos || isDeleting}
                  className="flex-1"
                >
                  {isSaving || isProcessingPhotos ? 'Sauvegarde...' : `Sauvegarder ${selectedPiece.nom_piece}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPiece(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PiecesStep;