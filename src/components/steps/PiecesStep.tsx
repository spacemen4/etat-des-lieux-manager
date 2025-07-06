import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePiecesByEtatId, useUpdatePiece, useCreatePiece, useDeletePiece } from '@/hooks/useEtatDesLieux'; // Added useDeletePiece
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertCircle, Home, LogOut, MessageSquare, Check, Camera, Upload, Image as ImageIcon } from 'lucide-react';

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
        // const result = await response.json(); // Supabase often returns minimal info on success
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
  category: string; // 'pieces'
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

const PIECES_TYPES = [ /* ... (garder la liste existante) ... */ ];
const PIECES_SUGGESTIONS = { /* ... (garder l'objet existant) ... */ };
const PIECE_FIELD_CONFIG = { /* ... (garder l'objet existant) ... */ };
const getFieldsForPiece = (pieceName: string) => { /* ... (garder la fonction existante) ... */ };


// Definitions from the original file - keeping them for brevity in this example
// const PIECES_TYPES = [ ... ];
// const PIECES_SUGGESTIONS = { ... };
// const PIECE_FIELD_CONFIG = { ... };
// const getFieldsForPiece = (pieceName: string) => { ... };
// These should be copied from the original file if not already present above. For this diff, assume they are.

const PiecesStep: React.FC<PiecesStepProps> = ({ etatId }) => {
  const { data: pieces, isLoading, error, refetch } = usePiecesByEtatId(etatId);
  const updatePieceMutation = useUpdatePiece();
  const createPieceMutation = useCreatePiece();
  const deletePieceMutation = useDeletePiece(); // Added

  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entree' | 'sortie'>('entree');
  
  const [formData, setFormData] = useState<PieceFormData>({}); // Initial state is empty, populated on piece selection

  // Photo states
  const [currentPieceNewPhotos, setCurrentPieceNewPhotos] = useState<(File & { description?: string })[]>([]);
  const [currentPieceExistingPhotos, setCurrentPieceExistingPhotos] = useState<Photo[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false); // For upload state
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (selectedPiece) {
      const { id, etat_des_lieux_id, nom_piece, photos, ...restData } = selectedPiece;
      setFormData(restData);
      setCurrentPieceExistingPhotos(photos || []);
      setCurrentPieceNewPhotos([]); // Reset new photos when piece changes
    } else {
      setFormData({});
      setCurrentPieceExistingPhotos([]);
      setCurrentPieceNewPhotos([]);
    }
  }, [selectedPiece]);

  const handleInputChange = (field: keyof PieceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Photo handling functions (specific to current selected piece)
  const handleFileSelectCurrentPiece = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedPiece) return;
    const validFiles: (File & { description?: string })[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`Fichier ${file.name} trop volumineux (max 5MB)`); return; }
      if (!file.type.startsWith('image/')) { toast.error(`Fichier ${file.name} n'est pas une image`); return; }
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
      // The change to existing photos will be saved with the main form save
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
          id: `${timestamp}_${randomId}`, name: photoFile.name, size: photoFile.size, type: photoFile.type,
          url: publicUrlData.publicUrl, description: photoFile.description || '',
          category: 'pieces', file_path: uploadData!.path
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
    setIsProcessingPhotos(true); // Indicate general saving might include photo processing

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
          setCurrentPieceNewPhotos([]); // Clear new photos for this piece
          refetch(); // Refetch all pieces to update the list
          // Optionally, update selectedPiece in state if backend returns the updated object
          // For now, refetch handles updating the list, and user might re-select
        },
        onError: (error) => {
          console.error('Erreur sauvegarde pièce:', error);
          toast.error('Erreur lors de la sauvegarde de la pièce.');
        },
      });
    } catch (error) {
      // Catch errors from _uploadPhotosForCurrentPiece
      toast.error(`Erreur lors du processus de sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleCreatePiece = () => { /* ... (garder la logique existante) ... */ };
  const handleQuickCreatePiece = (pieceName: string) => { /* ... (garder la logique existante) ... */ };
  const handleSuggestionSelect = (suggestion: string) => { /* ... (garder la logique existante) ... */ };
  const copyFromEntreeToSortie = () => { /* ... (garder la logique existante) ... */ };


  const handleDeletePiece = async (pieceId: string, pieceName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la pièce "${pieceName}" et toutes ses données associées (y compris les photos) ? Cette action est irréversible.`)) {
      // First, delete photos from storage if any
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
          setSelectedPiece(null); // Deselect if it was the selected one
          refetch();
        },
        onError: (error) => {
          toast.error(`Erreur lors de la suppression de la pièce: ${error.message}`);
        },
      });
    }
  };


  const renderPieceFields = (suffix: 'entree' | 'sortie') => { /* ... (garder la logique existante) ... */ };

  // UI Rendering (abbreviated for focus on photo section integration)
  if (isLoading) { /* ... */ }
  if (error) { /* ... */ }

  return (
    <div className="space-y-6">
      {/* ... (Dialog for creating piece - existing code) ... */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Pièces de l'état des lieux
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            {/* ... DialogTrigger and DialogContent for adding new piece ... */}
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* ... (Displaying list of pieces or empty state - existing code) ... */}
           {!pieces || pieces.length === 0 ? (
            <div className="text-center py-8">
              {/* ... empty state ... */}
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
                        onClick={(e) => { e.stopPropagation(); handleDeletePiece(piece.id, piece.nom_piece);}}
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
              {/* ... (TabsList and TabsContent for entree/sortie - existing code) ... */}
            </Tabs>

            {/* Section Photos for selectedPiece */}
            <div className="mt-6 p-4 border rounded-lg bg-slate-50 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Camera className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-700">Photos pour {selectedPiece.nom_piece}</h3>
                    <Badge variant="secondary">{currentPieceExistingPhotos.length + currentPieceNewPhotos.length} photo(s)</Badge>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer" onClick={() => !(isProcessingPhotos || updatePieceMutation.isPending) && fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelectCurrentPiece} className="hidden" disabled={isProcessingPhotos || updatePieceMutation.isPending}/>
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <Button type="button" variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); !(isProcessingPhotos || updatePieceMutation.isPending) && fileInputRef.current?.click();}} disabled={isProcessingPhotos || updatePieceMutation.isPending}>
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
                                    <img src={photo.url} alt={photo.name || `Photo ${selectedPiece.nom_piece}`} className="w-full h-28 object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur')} />
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveExistingPhotoCurrentPiece(photo.id, photo.file_path)} className="h-6 w-6 p-0" disabled={isProcessingPhotos || updatePieceMutation.isPending}><X className="h-3 w-3" /></Button>
                                    </div>
                                    <div className="p-2">
                                        <Input type="text" placeholder="Description" value={photo.description || ''} onChange={(e) => handleExistingPhotoDescriptionChangeCurrentPiece(photo.id, e.target.value)} className="text-xs h-7 w-full" disabled={isProcessingPhotos || updatePieceMutation.isPending}/>
                                        <p className="text-xs text-gray-500 truncate mt-1" title={photo.name}>{(photo.size / 1024).toFixed(1)} KB <span className="text-green-600">✓</span></p>
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
                                    <img src={URL.createObjectURL(photoFile)} alt={photoFile.name} className="w-full h-28 object-cover" />
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveNewPhotoCurrentPiece(idx)} className="h-6 w-6 p-0" disabled={isProcessingPhotos || updatePieceMutation.isPending}><X className="h-3 w-3" /></Button>
                                    </div>
                                    <div className="p-2">
                                        <Input type="text" placeholder="Description" value={photoFile.description || ''} onChange={(e) => handleNewPhotoDescriptionChangeCurrentPiece(idx, e.target.value)} className="text-xs h-7 w-full" disabled={isProcessingPhotos || updatePieceMutation.isPending}/>
                                        <p className="text-xs text-gray-500 truncate mt-1" title={photoFile.name}>{(photoFile.size / 1024).toFixed(1)} KB <span className="text-orange-500">↯</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


            {/* ... (Commentaires and Save/Close buttons - existing code) ... */}
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

// Make sure to copy PIECES_TYPES, PIECES_SUGGESTIONS, PIECE_FIELD_CONFIG, getFieldsForPiece from the original file
// For brevity, they are not repeated here but are essential for the component to work.
// (Assume they are present in the actual file before this export)

export default PiecesStep;

// --- Re-add the const definitions that were in the original file ---
// (These were outside the component, so they need to be at the top level of the module)

// const PIECES_TYPES = [ ... ]; (Copied from original)
// const PIECES_SUGGESTIONS = { ... }; (Copied from original)
// const PIECE_FIELD_CONFIG = { ... }; (Copied from original)
// const getFieldsForPiece = (pieceName: string) => { ... }; (Copied from original)

// --- End of re-added const definitions ---
