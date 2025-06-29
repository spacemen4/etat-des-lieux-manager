
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { usePiecesByEtatId, useUpdatePiece } from '@/hooks/useEtatDesLieux';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface PiecesStepProps {
  etatId: string;
}

const PiecesStep: React.FC<PiecesStepProps> = ({ etatId }) => {
  const { data: pieces, refetch } = usePiecesByEtatId(etatId);
  const updatePieceMutation = useUpdatePiece();

  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [formData, setFormData] = useState({
    revetements_sols_sortie: '',
    murs_menuiseries_sortie: '',
    plafond_sortie: '',
    electricite_plomberie_sortie: '',
  });

  useEffect(() => {
    if (selectedPiece) {
      setFormData({
        revetements_sols_sortie: selectedPiece.revetements_sols_sortie || '',
        murs_menuiseries_sortie: selectedPiece.murs_menuiseries_sortie || '',
        plafond_sortie: selectedPiece.plafond_sortie || '',
        electricite_plomberie_sortie: selectedPiece.electricite_plomberie_sortie || '',
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
        toast.success('Pièce sauvegardée');
        refetch();
      },
      onError: () => {
        toast.error('Erreur lors de la sauvegarde');
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une pièce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {pieces?.map((piece) => (
              <Button
                key={piece.id}
                variant={selectedPiece?.id === piece.id ? "default" : "outline"}
                onClick={() => setSelectedPiece(piece)}
                className="text-sm"
              >
                {piece.nom_piece}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPiece && (
        <Card>
          <CardHeader>
            <CardTitle>État de sortie - {selectedPiece.nom_piece}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Button onClick={handleSave} disabled={updatePieceMutation.isPending}>
              {updatePieceMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PiecesStep;
