
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import FormProgress from '@/components/FormProgress';
import { useUpdateEtatSortie } from '@/hooks/useEtatDesLieux';

interface EtatSortieFormProps {
  etatId: string;
}

const EtatSortieForm: React.FC<EtatSortieFormProps> = ({ etatId }) => {
  const navigate = useNavigate();
  const [isValidationChecked, setIsValidationChecked] = useState(false);
  
  const steps = [
    { id: 'general', title: 'Général', completed: true, current: false },
    { id: 'releve', title: 'Relevé des compteurs', completed: true, current: false },
    { id: 'pieces', title: 'Pièces', completed: true, current: false },
    { id: 'cles', title: 'Clés', completed: true, current: false },
    { id: 'parties', title: 'Parties privatives', completed: true, current: false },
    { id: 'autres', title: 'Autres équipements', completed: true, current: false },
    { id: 'energetique', title: 'Equipements énergétiques', completed: true, current: false },
    { id: 'chauffage', title: 'Equipements de chauffage', completed: true, current: false },
    { id: 'finalisation', title: 'Finalisation', completed: false, current: true },
  ];
  
  const updateEtatSortieMutation = useUpdateEtatSortie();

  const handleFinalize = async () => {
    if (!isValidationChecked) {
      toast.error('Vous devez confirmer la validation avant de finaliser');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    updateEtatSortieMutation.mutate(
      { 
        id: etatId, 
        date_sortie: today,
        statut: 'finalise'
      },
      {
        onSuccess: () => {
          toast.success('État des lieux finalisé avec succès');
          navigate('/');
        },
        onError: (error) => {
          console.error('Erreur lors de la finalisation:', error);
          toast.error('Erreur lors de la finalisation');
        }
      }
    );
  };

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    setIsValidationChecked(checked === true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              État des lieux de sortie
            </h2>
            <p className="text-slate-600">
              Complétez les informations pour finaliser l'état des lieux
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <FormProgress steps={steps} />

      {/* Finalization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Finaliser l'état des lieux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="validation"
              checked={isValidationChecked}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="validation">
              Je confirme que toutes les informations sont correctes et que l'état des lieux peut être finalisé
            </Label>
          </div>
          
          <Button
            onClick={handleFinalize}
            disabled={!isValidationChecked || updateEtatSortieMutation.isPending}
            className="w-full"
          >
            {updateEtatSortieMutation.isPending ? 'Finalisation...' : 'Finaliser l\'état des lieux'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtatSortieForm;
