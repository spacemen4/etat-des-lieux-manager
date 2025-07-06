import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertCircle, Home, LogOut, MessageSquare, Check, Camera, Upload, Image as ImageIcon, X } from 'lucide-react';

// Configuration Supabase (simulée)
const SUPABASE_URL = 'https://osqpvyrctlhagtzkbspv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcXB2eXJjdGxoYWd0emtic3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjg1NjYsImV4cCI6MjA2NjYwNDU2Nn0.4APWILaWXOtXCwdFYTk4MDithvZhp55ZJB6PnVn8D1w';

const supabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        const formDataBody = new FormData();
        formDataBody.append('file', file);
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: formDataBody
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

// Mock hooks pour la démo
const usePiecesByEtatId = (etatId: string) => {
  const [pieces, setPieces] = useState([]);
  
  return {
    data: pieces,
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

const useUpdatePiece = () => ({
  mutate: (data: any, callbacks: any) => {
    setTimeout(() => {
      callbacks.onSuccess();
    }, 1000);
  },
  isPending: false
});

const useCreatePiece = () => ({
  mutate: (data: any, callbacks: any) => {
    setTimeout(() => {
      callbacks.onSuccess();
    }, 1000);
  },
  isPending: false
});

const useDeletePiece = () => ({
  mutate: (id: string, callbacks: any) => {
    setTimeout(() => {
      callbacks.onSuccess();
    }, 1000);
  },
  isPending: false,
  variables: null
});

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

interface Piece {
  id: string;
  etat_des_lieux_id: string;
  nom_piece: string;
  revetements_sols_entree?: string;
  murs_menuiseries_entree?: string;
  plafond_entree?: string;
  electricite_plomberie_entree?: string;
  placards_entree?: string;
  sanitaires_entree?: string;
  menuiseries_entree?: string;
  rangements_entree?: string;
  baignoire_douche_entree?: string;
  eviers_robinetterie_entree?: string;
  chauffage_tuyauterie_entree?: string;
  meubles_cuisine_entree?: string;
  hotte_entree?: string;
  plaque_cuisson_entree?: string;
  revetements_sols_sortie?: string;
  murs_menuiseries_sortie?: string;
  plafond_sortie?: string;
  electricite_plomberie_sortie?: string;
  placards_sortie?: string;
  sanitaires_sortie?: string;
  menuiseries_sortie?: string;
  rangements_sortie?: string;
  baignoire_douche_sortie?: string;
  eviers_robinetterie_sortie?: string;
  chauffage_tuyauterie_sortie?: string;
  meubles_cuisine_sortie?: string;
  hotte_sortie?: string;
  plaque_cuisson_sortie?: string;
  commentaires?: string;
  photos: Photo[];
}

interface PieceFormData extends Omit<Partial<Piece>, 'id' | 'etat_des_lieux_id' | 'nom_piece' | 'photos'> {}

interface PiecesStepProps {
  etatId: string;
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

const getFieldsForPiece = (pieceName: string) => {
  // Trouver le type de pièce basé sur le nom
  const pieceType = PIECES_TYPES.find(type => 
    pieceName.toLowerCase().includes(type.toLowerCase()) || 
    PIECES_SUGGESTIONS[type]?.some(suggestion => 
      pieceName.toLowerCase().includes(suggestion.toLowerCase())
    )
  );
  
  return PIECE_FIELD_CONFIG[pieceType || 'Salon'] || [];
};

const PiecesStep: React.FC<PiecesStepProps> = ({ etatId }) => {
  const { data: pieces, isLoading, error, refetch } = usePiecesByEtatId(etatId);
  const updatePieceMutation = useUpdatePiece();
  const createPieceMutation = useCreatePiece();
  const deletePieceMutation = useDeletePiece();

  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entree' | 'sortie'>('entree');
  
  const [formData, setFormData] = useState<PieceFormData>({});

  // Photo states
  const [currentPieceNewPhotos, setCurrentPieceNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [currentPieceExistingPhotos, setCurrentPieceExistingPhotos] = useState<Photo[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedPiece) {
      const { id, etat_des_lieux_id, nom_piece, photos, ...restData } = selectedPiece;
      setFormData(restData);
      setCurrentPieceExistingPhotos(photos || []);
      setCurrentPieceNewPhotos([]);
    } else {
      setFormData({});
      setCurrentPieceExistingPhotos([]);
      setCurrentPieceNewPhotos([]);
    }
  }, [selectedPiece]);

  const handleInputChange = (field: keyof PieceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Photo handling functions
  const handleFileSelectCurrentPiece = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedPiece) return;
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
    setCurrentPieceNewPhotos(prev => [...prev, ...validFiles]);
  };

  const handleRemoveNewPhotoCurrentPiece = (photoIndex: number) => {
    setCurrentPieceNewPhotos(prev => prev.filter((_, index) => index !== photoIndex));
  };

  const handleNewPhotoDescriptionChangeCurrentPiece = (photoIndex: number, description: string) => {
    setCurrentPieceNewPhotos(prev => prev.map((photo, i) => i === photoIndex ? { ...photo, description } : photo));
  };

  const handleRemoveExistingPhotoCurrentPiece = async (photoId: string, filePath: string) => {
    if (!selectedPiece) return;
    setIsProcessingPhotos(true);
    try {
      await supabase.storage.from('etat-des-lieux-photos').remove([filePath]);
      setCurrentPieceExistingPhotos(prev => prev.filter(p => p.id !== photoId));
      toast.info('Photo retirée localement. Sauvegardez la pièce pour confirmer.');
    } catch (error) {
      toast.error('Erreur suppression photo stockage.');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleExistingPhotoDescriptionChangeCurrentPiece = (photoId: string, description: string) => {
    setCurrentPieceExistingPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
  };

  const _uploadPhotosForCurrentPiece = async (): Promise<Photo[]> => {
    if (currentPieceNewPhotos.length === 0 || !selectedPiece) return [];
    setIsProcessingPhotos(true);
    const uploadedResults: Photo[] = [];
    try {
      for (const photoFile of currentPieceNewPhotos) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileExtension = photoFile.name.split('.').pop();
        const fileName = `${etatId}/pieces/${selectedPiece.id}/${timestamp}_${randomId}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('etat-des-lieux-photos').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('etat-des-lieux-photos').getPublicUrl(uploadData!.path);
        uploadedResults.push({
          id: `${timestamp}_${randomId}`, 
          name: photoFile.name, 
          size: photoFile.size, 
          type: photoFile.type,
          url: publicUrlData.publicUrl, 
          description: photoFile.description || '',
          category: 'pieces', 
          file_path: uploadData!.path
        });
      }
      return uploadedResults;
    } catch (error) {
      toast.error(`Erreur upload photos: ${error instanceof Error ? error.message : 'Inconnue'}`);
      throw error;
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPiece) return;
    setIsProcessingPhotos(true);

    try {
      const newlyUploadedPhotos = await _uploadPhotosForCurrentPiece();
      const allPhotos = [...currentPieceExistingPhotos, ...newlyUploadedPhotos];

      const dataToSave: Piece = {
        id: selectedPiece.id,
        etat_des_lieux_id: etatId,
        nom_piece: selectedPiece.nom_piece,
        ...formData,
        photos: allPhotos,
      };

      updatePieceMutation.mutate(dataToSave, {
        onSuccess: () => {
          toast.success(`Pièce "${selectedPiece.nom_piece}" sauvegardée.`);
          setCurrentPieceNewPhotos([]);
          refetch();
        },
        onError: (error) => {
          console.error('Erreur sauvegarde pièce:', error);
          toast.error('Erreur lors de la sauvegarde de la pièce.');
        },
      });
    } catch (error) {
      toast.error(`Erreur lors du processus de sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleCreatePiece = () => {
    if (!newPieceName.trim()) {
      toast.error('Veuillez saisir un nom de pièce');
      return;
    }

    const newPiece: Omit<Piece, 'id'> = {
      etat_des_lieux_id: etatId,
      nom_piece: newPieceName.trim(),
      photos: []
    };

    createPieceMutation.mutate(newPiece, {
      onSuccess: () => {
        toast.success(`Pièce "${newPieceName}" créée avec succès`);
        setNewPieceName('');
        setSelectedSuggestion('');
        setIsCreateDialogOpen(false);
        refetch();
      },
      onError: (error) => {
        toast.error('Erreur lors de la création de la pièce');
        console.error('Erreur création pièce:', error);
      },
    });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setNewPieceName(suggestion);
  };

  const copyFromEntreeToSortie = () => {
    if (!selectedPiece) return;
    
    const entreeFields = getFieldsForPiece(selectedPiece.nom_piece);
    const newFormData = { ...formData };
    
    entreeFields.forEach(field => {
      const entreeKey = `${field}_entree` as keyof PieceFormData;
      const sortieKey = `${field}_sortie` as keyof PieceFormData;
      if (formData[entreeKey]) {
        newFormData[sortieKey] = formData[entreeKey];
      }
    });
    
    setFormData(newFormData);
    toast.info('Données copiées de l\'entrée vers la sortie');
  };

  const handleDeletePiece = async (pieceId: string, pieceName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la pièce "${pieceName}" et toutes ses données associées (y compris les photos) ? Cette action est irréversible.`)) {
      const pieceToDelete = pieces?.find(p => p.id === pieceId);
      if (pieceToDelete?.photos && pieceToDelete.photos.length > 0) {
        const photoPaths = pieceToDelete.photos.map(p => p.file_path);
        try {
          await supabase.storage.from('etat-des-lieux-photos').remove(photoPaths);
          toast.info("Photos associées en cours de suppression du stockage...");
        } catch (storageError) {
          toast.error("Erreur lors de la suppression des photos du stockage. La pièce sera supprimée de la base de données, mais les fichiers pourraient persister.");
          console.error("Storage deletion error:", storageError);
        }
      }

      deletePieceMutation.mutate(pieceId, {
        onSuccess: () => {
          toast.success(`Pièce "${pieceName}" supprimée.`);
          setSelectedPiece(null);
          refetch();
        },
        onError: (error) => {
          toast.error(`Erreur lors de la suppression de la pièce: ${error.message}`);
        },
      });
    }
  };

  const renderPieceFields = (suffix: 'entree' | 'sortie') => {
    if (!selectedPiece) return null;
    
    const fields = getFieldsForPiece(selectedPiece.nom_piece);
    const fieldLabels = {
      'revetements_sols': 'Revêtements de sols',
      'murs_menuiseries': 'Murs et menuiseries',
      'plafond': 'Plafond',
      'electricite_plomberie': 'Électricité et plomberie',
      'placards': 'Placards',
      'sanitaires': 'Sanitaires',
      'menuiseries': 'Menuiseries',
      'rangements': 'Rangements',
      'baignoire_douche': 'Baignoire/Douche',
      'eviers_robinetterie': 'Éviers et robinetterie',
      'chauffage_tuyauterie': 'Chauffage et tuyauterie',
      'meubles_cuisine': 'Meubles de cuisine',
      'hotte': 'Hotte',
      'plaque_cuisson': 'Plaque de cuisson'
    };

    return (
      <div className="space-y-4">
        {fields.map((field) => {
          const fieldKey = `${field}_${suffix}` as keyof PieceFormData;
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{fieldLabels[field] || field}</Label>
              <Textarea
                id={fieldKey}
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                placeholder={`Décrivez l'état des ${fieldLabels[field]?.toLowerCase() || field} lors de ${suffix === 'entree' ? 'l\'entrée' : 'la sortie'}`}
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

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Erreur lors du chargement des pièces</p>
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
            Pièces de l'état des lieux
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
                    disabled={!newPieceName.trim() || createPieceMutation.isPending}
                  >
                    {createPieceMutation.isPending ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!pieces || pieces.length === 0 ? (
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
                    disabled={deletePieceMutation.isPending && deletePieceMutation.variables === piece.id}
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
                {selectedPiece.nom_piece}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeletePiece(selectedPiece.id, selectedPiece.nom_piece)}
                className="text-red-500 hover:text-red-700"
                disabled={deletePieceMutation.isPending && deletePieceMutation.variables === selectedPiece.id}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer cette pièce
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'entree' | 'sortie')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entree">État à l'entrée</TabsTrigger>
                <TabsTrigger value="sortie">État à la sortie</TabsTrigger>
              </TabsList>
              <TabsContent value="entree">
                {renderPieceFields('entree')}
              </TabsContent>
              <TabsContent value="sortie">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyFromEntreeToSortie}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Copier depuis l'entrée
                    </Button>
                  </div>
                  {renderPieceFields('sortie')}
                </div>
              </TabsContent>
            </Tabs>

            {/* Section Photos */}
            <div className="mt-6 p-4 border rounded-lg bg-slate-50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-700">Photos pour {selectedPiece.nom_piece}</h3>
                <Badge variant="secondary">{currentPieceExistingPhotos.length + currentPieceNewPhotos.length} photo(s)</Badge>
              </div>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" 
                onClick={() => !(isProcessingPhotos || updatePieceMutation.isPending) && fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileSelectCurrentPiece} 
                  className="hidden" 
                  disabled={isProcessingPhotos || updatePieceMutation.isPending}
                />
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {e.stopPropagation(); !(isProcessingPhotos || updatePieceMutation.isPending) && fileInputRef.current?.click();}} 
                  disabled={isProcessingPhotos || updatePieceMutation.isPending}
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
                            disabled={isProcessingPhotos || updatePieceMutation.isPending}
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
                            disabled={isProcessingPhotos || updatePieceMutation.isPending}
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
                            disabled={isProcessingPhotos || updatePieceMutation.isPending}
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
                            disabled={isProcessingPhotos || updatePieceMutation.isPending}
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
            <div className="mt-6 space-y-2">
              <Label htmlFor="commentaires">Commentaires généraux</Label>
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
                disabled={updatePieceMutation.isPending || isProcessingPhotos || deletePieceMutation.isPending}
                className="flex-1"
              >
                {updatePieceMutation.isPending || isProcessingPhotos ? 'Sauvegarde...' : `Sauvegarder ${selectedPiece.nom_piece}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedPiece(null)}
              >
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PiecesStep;