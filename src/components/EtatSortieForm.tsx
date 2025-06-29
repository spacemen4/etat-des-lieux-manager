import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import FormProgress from '@/components/FormProgress';
import { useUpdateEtatSortie } from '@/hooks/useEtatDesLieux';

// Import des composants d'étapes
import GeneralStep from '@/components/steps/GeneralStep';
import ReleveCompteursStep from '@/components/steps/ReleveCompteursStep';
import PiecesStep from '@/components/steps/PiecesStep';
import ClesStep from '@/components/steps/ClesStep';
import PartiesPrivativesStep from '@/components/steps/PartiesPrivativesStep';
import AutresEquipementsStep from '@/components/steps/AutresEquipementsStep';
import EquipementsEnergetiquesStep from '@/components/steps/EquipementsEnergetiquesStep';
import EquipementsChauffageStep from '@/components/steps/EquipementsChauffageStep';

interface EtatSortieFormProps {
  etatId: string;
}

const EtatSortieForm: React.FC<EtatSortieFormProps> = ({ etatId }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidationChecked, setIsValidationChecked] = useState(false);
  
  const steps = [
    { id: 'general', title: 'Général', completed: false, current: true },
    { id: 'releve', title: 'Relevé des compteurs', completed: false, current: false },
    { id: 'pieces', title: 'Pièces', completed: false, current: false },
    { id: 'cles', title: 'Clés', completed: false, current: false },
    { id: 'parties', title: 'Parties privatives', completed: false, current: false },
    { id: 'autres', title: 'Autres équipements', completed: false, current: false },
    { id: 'energetique', title: 'Equipements énergétiques', completed: false, current: false },
    { id: 'chauffage', title: 'Equipements de chauffage', completed: false, current: false },
    { id: 'finalisation', title: 'Finalisation', completed: false, current: false },
  ];

  // Update steps based on current step
  const updatedSteps = steps.map((step, index) => ({
    ...step,
    completed: index < currentStep,
    current: index === currentStep
  }));
  
  const updateEtatSortieMutation = useUpdateEtatSortie();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Général
        return <GeneralStep etatId={etatId} />;
      
      case 1: // Relevé des compteurs
        return <ReleveCompteursStep etatId={etatId} />;
      
      case 2: // Pièces
        return <PiecesStep etatId={etatId} />;
      
      case 3: // Clés
        return <ClesStep etatId={etatId} />;
      
      case 4: // Parties privatives
        return <PartiesPrivativesStep etatId={etatId} />;
      
      case 5: // Autres équipements
        return <AutresEquipementsStep etatId={etatId} />;
      
      case 6: // Équipements énergétiques
        return <EquipementsEnergetiquesStep etatId={etatId} />;
      
      case 7: // Équipements de chauffage
        return <EquipementsChauffageStep etatId={etatId} />;
      
      case 8: // Finalisation
        return (
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
        );
      
      default:
        return null;
    }
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
              Étape {currentStep + 1} sur {steps.length}: {steps[currentStep].title}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <FormProgress steps={updatedSteps} />

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default EtatSortieForm;
