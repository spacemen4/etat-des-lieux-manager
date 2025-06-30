import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePiecesByEtatId, useUpdatePiece, useCreatePiece } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

interface PiecesStepProps {
  etatId: string;
}

const PIECES_TYPES = [
  'Salon',
  'Cuisine',
  'Chambre 1',
  'Chambre 2',
  'Chambre 3',
  'Salle de bain',
  'WC',
  'Couloir',
  'Entrée',
  'Balcon',
  'Terrasse',
  'Cave',
  'Garage',
  'Buanderie'
];

const PiecesStep: React.FC<PiecesStepProps> = ({ etatId }) => {
  const { data: pieces, isLoading, error, refetch } = usePiecesByEtatId(etatId);
  const updatePieceMutation = useUpdatePiece();
  const createPieceMutation = useCreatePiece();

  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [formData, setFormData] = useState({
    revetements_sols_sortie: '',
    murs_menuiseries_sortie: '',
    plafond_sortie: '',
    electricite_plomberie_sortie: '',
    placards_sortie: '',
    sanitaires_sortie: '',
    menuiseries_sortie: '',
    rangements_sortie: '',
    baignoire_douche_sortie: '',
    eviers_robinetterie_sortie: '',
    chauffage_tuyauterie_sortie: '',
    meubles_cuisine_sortie: '',
    hotte_sortie: '',
    plaque_cuisson_sortie: '',
    commentaires: '',
  });

  useEffect(() => {
    if (selectedPiece) {
      setFormData({
        revetements_sols_sortie: selectedPiece.revetements_sols_sortie || '',
        murs_menuiseries_sortie: selectedPiece.murs_menuiseries_sortie || '',
        plafond_sortie: selectedPiece.plafond_sortie || '',
        electricite_plomberie_sortie: selectedPiece.electricite_plomberie_sortie || '',
        placards_sortie: selectedPiece.placards_sortie || '',
        sanitaires_sortie: selectedPiece.sanitaires_sortie || '',
        menuiseries_sortie: selectedPiece.menuiseries_sortie || '',
        rangements_sortie: selectedPiece.rangements_sortie || '',
        baignoire_douche_sortie: selectedPiece.baignoire_douche_sortie || '',
        eviers_robinetterie_sortie: selectedPiece.eviers_robinetterie_sortie || '',
        chauffage_tuyauterie_sortie: selectedPiece.chauffage_tuyauterie_sortie || '',
        meubles_cuisine_sortie: selectedPiece.meubles_cuisine_sortie || '',
        hotte_sortie: selectedPiece.hotte_sortie || '',
        plaque_cuisson_sortie: selectedPiece.plaque_cuisson_sortie || '',
        commentaires: selectedPiece.commentaires || '',
      });
    }
  }, [selectedPiece]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!selectedPiece) return;

    updatePieceMutation.mutate({
      id: selectedPiece.id,
      etat_des_lieux_id: etatId,
      nom_piece: selectedPiece.nom_piece,
      ...formData,
    }, {
      onSuccess: () => {
        toast.success('Pièce sauvegardée avec succès');
        refetch();
      },
      onError: (error) => {
        console.error('Erreur lors de la sauvegarde:', error);
        toast.error('Erreur lors de la sauvegarde');
      },
    });
  };

  const handleCreatePiece = () => {
    if (!newPieceName.trim()) {
      toast.error('Veuillez saisir un nom de pièce');
      return;
    }

    console.log('Tentative de création de pièce:', {
      etat_des_lieux_id: etatId,
      nom_piece: newPieceName.trim(),
    });

    createPieceMutation.mutate({
      etat_des_lieux_id: etatId,
      nom_piece: newPieceName.trim(),
    }, {
      onSuccess: (data) => {
        console.log('Pièce créée avec succès:', data);
        toast.success('Pièce créée avec succès');
        setIsCreateDialogOpen(false);
        setNewPieceName('');
        refetch();
      },
      onError: (error) => {
        console.error('Erreur complète lors de la création:', error);
        console.error('Type d\'erreur:', typeof error);
        console.error('Message d\'erreur:', error?.message);
        console.error('Response:', error?.response);

        // Gestion spécifique des erreurs API
        if (error?.message?.includes('<!DOCTYPE')) {
          toast.error('Erreur de configuration API - Page HTML reçue au lieu de JSON');
        } else if (error?.message?.includes('SyntaxError')) {
          toast.error('Erreur de format de réponse API');
        } else if (error?.response?.status === 401) {
          toast.error('Erreur d\'authentification - Veuillez vous reconnecter');
        } else if (error?.response?.status === 403) {
          toast.error('Permissions insuffisantes');
        } else if (error?.response?.status === 404) {
          toast.error('Endpoint API non trouvé');
        } else if (error?.response?.status >= 500) {
          toast.error('Erreur serveur - Veuillez réessayer plus tard');
        } else {
          toast.error(`Erreur lors de la création: ${error?.message || 'Erreur inconnue'}`);
        }
      },
    });
  };

  const handleQuickCreatePiece = (pieceName: string) => {
    console.log('Création rapide de pièce:', {
      etat_des_lieux_id: etatId,
      nom_piece: pieceName,
    });

    createPieceMutation.mutate({
      etat_des_lieux_id: etatId,
      nom_piece: pieceName,
    }, {
      onSuccess: (data) => {
        console.log('Pièce créée avec succès:', data);
        toast.success(`${pieceName} créée avec succès`);
        refetch();
      },
      onError: (error) => {
        console.error('Erreur complète lors de la création rapide:', error);

        // Même gestion d'erreur que pour handleCreatePiece
        if (error?.message?.includes('<!DOCTYPE')) {
          toast.error('Erreur de configuration API - Page HTML reçue au lieu de JSON');
        } else if (error?.message?.includes('SyntaxError')) {
          toast.error('Erreur de format de réponse API');
        } else if (error?.response?.status === 401) {
          toast.error('Erreur d\'authentification - Veuillez vous reconnecter');
        } else if (error?.response?.status === 403) {
          toast.error('Permissions insuffisantes');
        } else if (error?.response?.status === 404) {
          toast.error('Endpoint API non trouvé');
        } else if (error?.response?.status >= 500) {
          toast.error('Erreur serveur - Veuillez réessayer plus tard');
        } else {
          toast.error(`Erreur lors de la création de ${pieceName}: ${error?.message || 'Erreur inconnue'}`);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des pièces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" />
          <p>Erreur lors du chargement des pièces</p>
          <Button onClick={() => refetch()} className="mt-2">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Debug: Affichage des informations pour le développement
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="space-y-4">
      {isDevelopment && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700">
            <div className="space-y-1">
              <p><strong>EtatId:</strong> {etatId}</p>
              <p><strong>Pieces count:</strong> {pieces?.length || 0}</p>
              <p><strong>Loading:</strong> {isLoading ? 'Oui' : 'Non'}</p>
              <p><strong>Error:</strong> {error ? error.message : 'Aucune'}</p>
              <p><strong>CreatePiece pending:</strong> {createPieceMutation.isPending ? 'Oui' : 'Non'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pièces de l'état des lieux</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une pièce
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle pièce</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="piece-name">Nom de la pièce</Label>
                  <Input
                    id="piece-name"
                    value={newPieceName}
                    onChange={(e) => setNewPieceName(e.target.value)}
                    placeholder="Ex: Salon, Chambre 1, Cuisine..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreatePiece}
                    disabled={createPieceMutation.isPending}
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
              <p className="text-gray-500 mb-4">
                Aucune pièce n'a été créée pour cet état des lieux.
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Créez rapidement des pièces courantes :
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {PIECES_TYPES.map((piece) => (
                  <Button
                    key={piece}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCreatePiece(piece)}
                    disabled={createPieceMutation.isPending}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {piece}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {pieces.map((piece) => (
                <Button
                  key={piece.id}
                  variant={selectedPiece?.id === piece.id ? "default" : "outline"}
                  onClick={() => setSelectedPiece(piece)}
                  className="text-sm justify-start"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  {piece.nom_piece}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPiece && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              État de sortie - {selectedPiece.nom_piece}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="revetements_sols_sortie">Revêtements sols</Label>
                <Input
                  id="revetements_sols_sortie"
                  value={formData.revetements_sols_sortie}
                  onChange={(e) => handleInputChange('revetements_sols_sortie', e.target.value)}
                  placeholder="État des revêtements de sols"
                />
              </div>

              <div>
                <Label htmlFor="murs_menuiseries_sortie">Murs et menuiseries</Label>
                <Input
                  id="murs_menuiseries_sortie"
                  value={formData.murs_menuiseries_sortie}
                  onChange={(e) => handleInputChange('murs_menuiseries_sortie', e.target.value)}
                  placeholder="État des murs et menuiseries"
                />
              </div>

              <div>
                <Label htmlFor="plafond_sortie">Plafond</Label>
                <Input
                  id="plafond_sortie"
                  value={formData.plafond_sortie}
                  onChange={(e) => handleInputChange('plafond_sortie', e.target.value)}
                  placeholder="État du plafond"
                />
              </div>

              <div>
                <Label htmlFor="electricite_plomberie_sortie">Électricité et plomberie</Label>
                <Input
                  id="electricite_plomberie_sortie"
                  value={formData.electricite_plomberie_sortie}
                  onChange={(e) => handleInputChange('electricite_plomberie_sortie', e.target.value)}
                  placeholder="État de l'électricité et plomberie"
                />
              </div>

              <div>
                <Label htmlFor="placards_sortie">Placards</Label>
                <Input
                  id="placards_sortie"
                  value={formData.placards_sortie}
                  onChange={(e) => handleInputChange('placards_sortie', e.target.value)}
                  placeholder="État des placards"
                />
              </div>

              <div>
                <Label htmlFor="sanitaires_sortie">Sanitaires</Label>
                <Input
                  id="sanitaires_sortie"
                  value={formData.sanitaires_sortie}
                  onChange={(e) => handleInputChange('sanitaires_sortie', e.target.value)}
                  placeholder="État des sanitaires"
                />
              </div>

              <div>
                <Label htmlFor="rangements_sortie">Rangements</Label>
                <Input
                  id="rangements_sortie"
                  value={formData.rangements_sortie}
                  onChange={(e) => handleInputChange('rangements_sortie', e.target.value)}
                  placeholder="État des rangements"
                />
              </div>

              <div>
                <Label htmlFor="baignoire_douche_sortie">Baignoire/Douche</Label>
                <Input
                  id="baignoire_douche_sortie"
                  value={formData.baignoire_douche_sortie}
                  onChange={(e) => handleInputChange('baignoire_douche_sortie', e.target.value)}
                  placeholder="État de la baignoire/douche"
                />
              </div>

              <div>
                <Label htmlFor="eviers_robinetterie_sortie">Éviers et robinetterie</Label>
                <Input
                  id="eviers_robinetterie_sortie"
                  value={formData.eviers_robinetterie_sortie}
                  onChange={(e) => handleInputChange('eviers_robinetterie_sortie', e.target.value)}
                  placeholder="État des éviers et robinetterie"
                />
              </div>

              <div>
                <Label htmlFor="chauffage_tuyauterie_sortie">Chauffage et tuyauterie</Label>
                <Input
                  id="chauffage_tuyauterie_sortie"
                  value={formData.chauffage_tuyauterie_sortie}
                  onChange={(e) => handleInputChange('chauffage_tuyauterie_sortie', e.target.value)}
                  placeholder="État du chauffage et tuyauterie"
                />
              </div>

              <div>
                <Label htmlFor="meubles_cuisine_sortie">Meubles de cuisine</Label>
                <Input
                  id="meubles_cuisine_sortie"
                  value={formData.meubles_cuisine_sortie}
                  onChange={(e) => handleInputChange('meubles_cuisine_sortie', e.target.value)}
                  placeholder="État des meubles de cuisine"
                />
              </div>

              <div>
                <Label htmlFor="hotte_sortie">Hotte</Label>
                <Input
                  id="hotte_sortie"
                  value={formData.hotte_sortie}
                  onChange={(e) => handleInputChange('hotte_sortie', e.target.value)}
                  placeholder="État de la hotte"
                />
              </div>

              <div>
                <Label htmlFor="plaque_cuisson_sortie">Plaque de cuisson</Label>
                <Input
                  id="plaque_cuisson_sortie"
                  value={formData.plaque_cuisson_sortie}
                  onChange={(e) => handleInputChange('plaque_cuisson_sortie', e.target.value)}
                  placeholder="État de la plaque de cuisson"
                />
              </div>
            </div>

            <div className="col-span-full">
              <Label htmlFor="commentaires">Commentaires</Label>
              <Input
                id="commentaires"
                value={formData.commentaires}
                onChange={(e) => handleInputChange('commentaires', e.target.value)}
                placeholder="Commentaires généraux sur la pièce"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={updatePieceMutation.isPending}
                className="flex-1"
              >
                {updatePieceMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedPiece(null)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PiecesStep;
