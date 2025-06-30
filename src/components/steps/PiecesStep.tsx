import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePiecesByEtatId, useUpdatePiece, useCreatePiece } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, AlertCircle, Home, LogOut, MessageSquare } from 'lucide-react';

interface PiecesStepProps {
  etatId: string;
}

interface PieceFormData {
  // Champs d'entrée
  revetements_sols_entree: string;
  murs_menuiseries_entree: string;
  plafond_entree: string;
  electricite_plomberie_entree: string;
  placards_entree: string;
  sanitaires_entree: string;
  menuiseries_entree: string;
  rangements_entree: string;
  baignoire_douche_entree: string;
  eviers_robinetterie_entree: string;
  chauffage_tuyauterie_entree: string;
  meubles_cuisine_entree: string;
  hotte_entree: string;
  plaque_cuisson_entree: string;
  
  // Champs de sortie
  revetements_sols_sortie: string;
  murs_menuiseries_sortie: string;
  plafond_sortie: string;
  electricite_plomberie_sortie: string;
  placards_sortie: string;
  sanitaires_sortie: string;
  menuiseries_sortie: string;
  rangements_sortie: string;
  baignoire_douche_sortie: string;
  eviers_robinetterie_sortie: string;
  chauffage_tuyauterie_sortie: string;
  meubles_cuisine_sortie: string;
  hotte_sortie: string;
  plaque_cuisson_sortie: string;
  
  // Commentaires
  commentaires: string;
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

const FIELD_GROUPS = [
  {
    title: 'Structure',
    fields: [
      { key: 'revetements_sols', label: 'Revêtements sols', placeholder: 'État des revêtements de sols' },
      { key: 'murs_menuiseries', label: 'Murs et menuiseries', placeholder: 'État des murs et menuiseries' },
      { key: 'plafond', label: 'Plafond', placeholder: 'État du plafond' },
      { key: 'menuiseries', label: 'Menuiseries', placeholder: 'État des menuiseries' },
    ]
  },
  {
    title: 'Équipements techniques',
    fields: [
      { key: 'electricite_plomberie', label: 'Électricité et plomberie', placeholder: 'État de l\'électricité et plomberie' },
      { key: 'chauffage_tuyauterie', label: 'Chauffage et tuyauterie', placeholder: 'État du chauffage et tuyauterie' },
    ]
  },
  {
    title: 'Rangements et mobilier',
    fields: [
      { key: 'placards', label: 'Placards', placeholder: 'État des placards' },
      { key: 'rangements', label: 'Rangements', placeholder: 'État des rangements' },
    ]
  },
  {
    title: 'Sanitaires',
    fields: [
      { key: 'sanitaires', label: 'Sanitaires', placeholder: 'État des sanitaires' },
      { key: 'baignoire_douche', label: 'Baignoire/Douche', placeholder: 'État de la baignoire/douche' },
      { key: 'eviers_robinetterie', label: 'Éviers et robinetterie', placeholder: 'État des éviers et robinetterie' },
    ]
  },
  {
    title: 'Cuisine',
    fields: [
      { key: 'meubles_cuisine', label: 'Meubles de cuisine', placeholder: 'État des meubles de cuisine' },
      { key: 'hotte', label: 'Hotte', placeholder: 'État de la hotte' },
      { key: 'plaque_cuisson', label: 'Plaque de cuisson', placeholder: 'État de la plaque de cuisson' },
    ]
  }
];

const PiecesStep: React.FC<PiecesStepProps> = ({ etatId }) => {
  const { data: pieces, isLoading, error, refetch } = usePiecesByEtatId(etatId);
  const updatePieceMutation = useUpdatePiece();
  const createPieceMutation = useCreatePiece();

  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [activeTab, setActiveTab] = useState<'entree' | 'sortie'>('entree');
  
  const [formData, setFormData] = useState<PieceFormData>({
    // État d'entrée
    revetements_sols_entree: '',
    murs_menuiseries_entree: '',
    plafond_entree: '',
    electricite_plomberie_entree: '',
    placards_entree: '',
    sanitaires_entree: '',
    menuiseries_entree: '',
    rangements_entree: '',
    baignoire_douche_entree: '',
    eviers_robinetterie_entree: '',
    chauffage_tuyauterie_entree: '',
    meubles_cuisine_entree: '',
    hotte_entree: '',
    plaque_cuisson_entree: '',
    
    // État de sortie
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
    
    // Commentaires
    commentaires: '',
  });

  useEffect(() => {
    if (selectedPiece) {
      setFormData({
        // État d'entrée
        revetements_sols_entree: selectedPiece.revetements_sols_entree || '',
        murs_menuiseries_entree: selectedPiece.murs_menuiseries_entree || '',
        plafond_entree: selectedPiece.plafond_entree || '',
        electricite_plomberie_entree: selectedPiece.electricite_plomberie_entree || '',
        placards_entree: selectedPiece.placards_entree || '',
        sanitaires_entree: selectedPiece.sanitaires_entree || '',
        menuiseries_entree: selectedPiece.menuiseries_entree || '',
        rangements_entree: selectedPiece.rangements_entree || '',
        baignoire_douche_entree: selectedPiece.baignoire_douche_entree || '',
        eviers_robinetterie_entree: selectedPiece.eviers_robinetterie_entree || '',
        chauffage_tuyauterie_entree: selectedPiece.chauffage_tuyauterie_entree || '',
        meubles_cuisine_entree: selectedPiece.meubles_cuisine_entree || '',
        hotte_entree: selectedPiece.hotte_entree || '',
        plaque_cuisson_entree: selectedPiece.plaque_cuisson_entree || '',
        
        // État de sortie
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
        
        // Commentaires
        commentaires: selectedPiece.commentaires || '',
      });
    }
  }, [selectedPiece]);

  const handleInputChange = (field: keyof PieceFormData, value: string) => {
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

    createPieceMutation.mutate({
      etat_des_lieux_id: etatId,
      nom_piece: newPieceName.trim(),
    }, {
      onSuccess: (data) => {
        toast.success('Pièce créée avec succès');
        setIsCreateDialogOpen(false);
        setNewPieceName('');
        refetch();
      },
      onError: (error) => {
        console.error('Erreur lors de la création:', error);
        
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
    createPieceMutation.mutate({
      etat_des_lieux_id: etatId,
      nom_piece: pieceName,
    }, {
      onSuccess: () => {
        toast.success(`${pieceName} créée avec succès`);
        refetch();
      },
      onError: (error) => {
        console.error('Erreur lors de la création rapide:', error);
        
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

  const copyFromEntreeToSortie = () => {
    const updatedFormData = { ...formData };
    
    // Copier tous les champs d'entrée vers sortie
    FIELD_GROUPS.forEach(group => {
      group.fields.forEach(field => {
        const entreeKey = `${field.key}_entree` as keyof PieceFormData;
        const sortieKey = `${field.key}_sortie` as keyof PieceFormData;
        updatedFormData[sortieKey] = formData[entreeKey];
      });
    });
    
    setFormData(updatedFormData);
    setActiveTab('sortie');
    toast.success('État d\'entrée copié vers l\'état de sortie');
  };

  const renderFieldGroup = (group: typeof FIELD_GROUPS[0], suffix: 'entree' | 'sortie') => (
    <Card key={group.title} className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{group.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {group.fields.map((field) => {
            const fieldKey = `${field.key}_${suffix}` as keyof PieceFormData;
            return (
              <div key={fieldKey}>
                <Label htmlFor={fieldKey}>{field.label}</Label>
                <Input
                  id={fieldKey}
                  value={formData[fieldKey]}
                  onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

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
    <div className="space-y-6">
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
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Pièces de l'état des lieux
          </CardTitle>
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
              {selectedPiece.nom_piece}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'entree' | 'sortie')}>
              <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="entree" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    État d'entrée
                  </TabsTrigger>
                  <TabsTrigger value="sortie" className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    État de sortie
                  </TabsTrigger>
                </TabsList>
                
                {activeTab === 'sortie' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyFromEntreeToSortie}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Copier depuis l'entrée
                  </Button>
                )}
              </div>

              <TabsContent value="entree" className="space-y-4">
                {FIELD_GROUPS.map(group => renderFieldGroup(group, 'entree'))}
              </TabsContent>

              <TabsContent value="sortie" className="space-y-4">
                {FIELD_GROUPS.map(group => renderFieldGroup(group, 'sortie'))}
              </TabsContent>
            </Tabs>

            {/* Section commentaires commune */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Commentaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="commentaires">Commentaires généraux</Label>
                  <Textarea
                    id="commentaires"
                    value={formData.commentaires}
                    onChange={(e) => handleInputChange('commentaires', e.target.value)}
                    placeholder="Commentaires généraux sur la pièce, observations particulières..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-6">
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