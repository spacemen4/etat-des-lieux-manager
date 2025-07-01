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
import { Plus, Edit, Trash2, AlertCircle, Home, LogOut, MessageSquare, Check } from 'lucide-react';

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
  // Pièces principales
  'Salon',
  'Séjour',
  'Salon/Séjour', 
  'Cuisine',
  'Cuisine américaine',
  'Cuisine équipée',
  
  // Chambres
  'Chambre principale',
  'Chambre 1',
  'Chambre 2',
  'Chambre 3',
  'Chambre parentale',
  'Suite parentale',
  'Chambre d\'enfant',
  'Chambre d\'amis',
  
  // Sanitaires et WC
  'Salle de bain',
  'Salle de bain principale',
  'Salle d\'eau',
  'Salle de douche',
  'WC',
  'WC invités',
  'WC séparé',
  
  // Espaces de circulation
  'Entrée',
  'Hall d\'entrée',
  'Couloir',
  'Palier',
  'Dégagement',
  
  // Espaces de travail et rangement
  'Bureau',
  'Bibliothèque',
  'Dressing',
  'Placard',
  'Cellier',
  'Buanderie',
  'Lingerie',
  
  // Espaces extérieurs
  'Balcon',
  'Terrasse',
  'Loggia',
  'Véranda',
  'Jardin d\'hiver',
  
  // Espaces de stockage et techniques
  'Cave',
  'Garage',
  'Box',
  'Grenier',
  'Combles',
  'Local technique',
  'Chaufferie',
  
  // Espaces spéciaux
  'Mezzanine',
  'Sous-sol',
  'Duplex (étage)',
  'Studio',
  'Kitchenette'
];

// Suggestions organisées par catégories
const PIECES_SUGGESTIONS = {
  'Pièces principales': [
    'Salon',
    'Séjour',
    'Salon/Séjour',
    'Cuisine',
    'Cuisine américaine',
    'Cuisine équipée'
  ],
  'Chambres': [
    'Chambre principale',
    'Chambre parentale',
    'Suite parentale',
    'Chambre 1',
    'Chambre 2',
    'Chambre 3',
    'Chambre d\'enfant',
    'Chambre d\'amis'
  ],
  'Sanitaires': [
    'Salle de bain',
    'Salle de bain principale',
    'Salle d\'eau',
    'Salle de douche',
    'WC',
    'WC invités',
    'WC séparé'
  ],
  'Circulation': [
    'Entrée',
    'Hall d\'entrée',
    'Couloir',
    'Palier',
    'Dégagement'
  ],
  'Rangement': [
    'Dressing',
    'Placard',
    'Cellier',
    'Buanderie',
    'Lingerie',
    'Bureau'
  ],
  'Extérieur': [
    'Balcon',
    'Terrasse',
    'Loggia',
    'Véranda',
    'Jardin d\'hiver'
  ],
  'Stockage': [
    'Cave',
    'Garage',
    'Box',
    'Grenier',
    'Combles',
    'Local technique'
  ]
};

// Configuration des champs par type de pièce
const PIECE_FIELD_CONFIG = {
  // Champs communs à toutes les pièces
  common: [
    { key: 'revetements_sols', label: 'Revêtements sols', placeholder: 'Parquet, carrelage, moquette...' },
    { key: 'murs_menuiseries', label: 'Murs et peintures', placeholder: 'État des murs, peinture, papier peint...' },
    { key: 'plafond', label: 'Plafond', placeholder: 'État du plafond, fissures, peinture...' },
    { key: 'menuiseries', label: 'Menuiseries', placeholder: 'Portes, fenêtres, volets...' },
    { key: 'electricite_plomberie', label: 'Électricité', placeholder: 'Prises, interrupteurs, éclairage...' },
  ],
  
  // Champs spécifiques par type de pièce
  cuisine: [
    { key: 'meubles_cuisine', label: 'Meubles de cuisine', placeholder: 'Placards, tiroirs, plan de travail...' },
    { key: 'hotte', label: 'Hotte aspirante', placeholder: 'État et fonctionnement de la hotte...' },
    { key: 'plaque_cuisson', label: 'Plaque de cuisson', placeholder: 'Gaz, électrique, induction...' },
    { key: 'eviers_robinetterie', label: 'Évier et robinetterie', placeholder: 'État de l\'évier et du robinet...' },
    { key: 'electricite_plomberie', label: 'Électricité et plomberie', placeholder: 'Arrivées eau, gaz, prises spécialisées...' },
  ],
  
  sanitaires: [
    { key: 'sanitaires', label: 'Équipements sanitaires', placeholder: 'WC, lavabo, bidet...' },
    { key: 'baignoire_douche', label: 'Baignoire/Douche', placeholder: 'État de la baignoire ou douche...' },
    { key: 'eviers_robinetterie', label: 'Robinetterie', placeholder: 'Mitigeurs, robinets, état général...' },
    { key: 'electricite_plomberie', label: 'Plomberie', placeholder: 'Arrivées d\'eau, évacuations...' },
  ],
  
  rangement: [
    { key: 'placards', label: 'Placards', placeholder: 'Placards intégrés, étagères...' },
    { key: 'rangements', label: 'Rangements', placeholder: 'Penderies, tiroirs, aménagements...' },
  ],
  
  technique: [
    { key: 'chauffage_tuyauterie', label: 'Chauffage', placeholder: 'Radiateurs, tuyauterie, thermostat...' },
    { key: 'electricite_plomberie', label: 'Installations techniques', placeholder: 'Compteurs, tableau électrique...' },
  ],
  
  exterieur: [
    { key: 'revetements_sols', label: 'Revêtement sol', placeholder: 'Carrelage, bois, béton...' },
    { key: 'menuiseries', label: 'Menuiseries', placeholder: 'Garde-corps, portails, volets...' },
  ]
};

// Fonction pour déterminer les champs à afficher selon le type de pièce
const getFieldsForPiece = (pieceName: string) => {
  const lowerPieceName = pieceName.toLowerCase();
  let fields = [...PIECE_FIELD_CONFIG.common];
  
  // Cuisine
  if (lowerPieceName.includes('cuisine')) {
    fields = [...fields, ...PIECE_FIELD_CONFIG.cuisine];
  }
  
  // Sanitaires
  if (lowerPieceName.includes('salle de bain') || 
      lowerPieceName.includes('salle d\'eau') || 
      lowerPieceName.includes('salle de douche') ||
      lowerPieceName.includes('wc')) {
    fields = [...fields, ...PIECE_FIELD_CONFIG.sanitaires];
  }
  
  // Espaces avec rangements
  if (lowerPieceName.includes('chambre') || 
      lowerPieceName.includes('dressing') ||
      lowerPieceName.includes('placard') ||
      lowerPieceName.includes('cellier') ||
      lowerPieceName.includes('buanderie')) {
    fields = [...fields, ...PIECE_FIELD_CONFIG.rangement];
  }
  
  // Espaces techniques
  if (lowerPieceName.includes('cave') ||
      lowerPieceName.includes('garage') ||
      lowerPieceName.includes('local technique') ||
      lowerPieceName.includes('chaufferie') ||
      lowerPieceName.includes('sous-sol')) {
    fields = [...fields, ...PIECE_FIELD_CONFIG.technique];
  }
  
  // Espaces extérieurs
  if (lowerPieceName.includes('balcon') ||
      lowerPieceName.includes('terrasse') ||
      lowerPieceName.includes('loggia') ||
      lowerPieceName.includes('véranda')) {
    // Pour les extérieurs, on garde seulement certains champs
    fields = PIECE_FIELD_CONFIG.exterieur;
  }
  
  // Ajouter le chauffage pour toutes les pièces sauf extérieures
  if (!lowerPieceName.includes('balcon') &&
      !lowerPieceName.includes('terrasse') &&
      !lowerPieceName.includes('loggia')) {
    if (!fields.some(f => f.key === 'chauffage_tuyauterie')) {
      fields.push({ key: 'chauffage_tuyauterie', label: 'Chauffage', placeholder: 'Radiateurs, convecteurs, chauffage au sol...' });
    }
  }
  
  // Supprimer les doublons
  const uniqueFields = fields.filter((field, index, self) => 
    index === self.findIndex(f => f.key === field.key)
  );
  
  return uniqueFields;
};

const PiecesStep: React.FC<PiecesStepProps> = ({ etatId }) => {
  const { data: pieces, isLoading, error, refetch } = usePiecesByEtatId(etatId);
  const updatePieceMutation = useUpdatePiece();
  const createPieceMutation = useCreatePiece();

  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPieceName, setNewPieceName] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
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
    const pieceName = (selectedSuggestion || newPieceName).trim();
    
    if (!pieceName) {
      toast.error('Veuillez saisir un nom de pièce ou sélectionner une suggestion');
      return;
    }

    createPieceMutation.mutate({
      etat_des_lieux_id: etatId,
      nom_piece: pieceName,
    }, {
      onSuccess: (data) => {
        toast.success('Pièce créée avec succès');
        setIsCreateDialogOpen(false);
        setNewPieceName('');
        setSelectedSuggestion('');
        refetch();
      },
      onError: (error) => {
        console.error('Erreur lors de la création:', error);
        
        if (error?.message?.includes('<!DOCTYPE')) {
          toast.error('Erreur de configuration API - Page HTML reçue au lieu de JSON');
        } else if (error?.message?.includes('SyntaxError')) {
          toast.error('Erreur de format de réponse API');
        } else if ((error as any)?.code === '23505') {
          toast.error('Cette pièce existe déjà');
        } else if ((error as any)?.code === '23503') {
          toast.error('Erreur de référence - État des lieux introuvable');
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
        } else if ((error as any)?.code === '23505') {
          toast.error('Cette pièce existe déjà');
        } else if ((error as any)?.code === '23503') {
          toast.error('Erreur de référence - État des lieux introuvable');
        } else {
          toast.error(`Erreur lors de la création de ${pieceName}: ${error?.message || 'Erreur inconnue'}`);
        }
      },
    });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setNewPieceName(''); // Vider le champ personnalisé
  };

  const copyFromEntreeToSortie = () => {
    const updatedFormData = { ...formData };
    const fieldsForPiece = getFieldsForPiece(selectedPiece.nom_piece);
    
    // Copier tous les champs pertinents d'entrée vers sortie
    fieldsForPiece.forEach(field => {
      const entreeKey = `${field.key}_entree` as keyof PieceFormData;
      const sortieKey = `${field.key}_sortie` as keyof PieceFormData;
      updatedFormData[sortieKey] = formData[entreeKey];
    });
    
    setFormData(updatedFormData);
    setActiveTab('sortie');
    toast.success('État d\'entrée copié vers l\'état de sortie');
  };

  const renderPieceFields = (suffix: 'entree' | 'sortie') => {
    if (!selectedPiece) return null;
    
    const fieldsForPiece = getFieldsForPiece(selectedPiece.nom_piece);
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {suffix === 'entree' ? (
              <>
                <Home className="h-5 w-5" />
                État d'entrée - {selectedPiece.nom_piece}
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                État de sortie - {selectedPiece.nom_piece}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldsForPiece.map((field) => {
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle pièce</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Suggestions organisées par catégories */}
                <div>
                  <Label className="text-base font-semibold">Suggestions de pièces</Label>
                  <p className="text-sm text-gray-600 mb-4">Cliquez sur une suggestion ou saisissez un nom personnalisé</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(PIECES_SUGGESTIONS).map(([category, suggestions]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700 border-b pb-1">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 gap-1">
                          {suggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant={selectedSuggestion === suggestion ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSuggestionSelect(suggestion)}
                              className="justify-start text-sm h-8"
                            >
                              {selectedSuggestion === suggestion && (
                                <Check className="h-3 w-3 mr-2" />
                              )}
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ligne de séparation */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">ou</span>
                  </div>
                </div>

                {/* Champ de saisie personnalisé */}
                <div>
                  <Label htmlFor="piece-name">Nom personnalisé</Label>
                  <Input
                    id="piece-name"
                    value={newPieceName}
                    onChange={(e) => {
                      setNewPieceName(e.target.value);
                      if (e.target.value) {
                        setSelectedSuggestion(''); // Vider la suggestion si on tape du texte
                      }
                    }}
                    placeholder="Ex: Salon/Salle à manger, Chambre bureau, Salle de jeux..."
                  />
                </div>

                {/* Aperçu de la sélection */}
                {(selectedSuggestion || newPieceName) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Pièce à créer :</strong> {selectedSuggestion || newPieceName}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setNewPieceName('');
                      setSelectedSuggestion('');
                    }}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
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
                {renderPieceFields('entree')}
              </TabsContent>

              <TabsContent value="sortie" className="space-y-4">
                {renderPieceFields('sortie')}
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
