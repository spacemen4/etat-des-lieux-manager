import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import FormProgress from '@/components/FormProgress';
import { useEtatDesLieuxById, useUpdateEtatSortie } from '@/hooks/useEtatDesLieux';
import type { EtatDesLieux } from '@/types/etatDesLieux';


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
  const [initialEtatDesLieux, setInitialEtatDesLieux] = useState<EtatDesLieux | null>(null);
  const [travauxAFaire, setTravauxAFaire] = useState(false);
  const [descriptionTravaux, setDescriptionTravaux] = useState('');

  const { data: etatData, isLoading: isLoadingEtat, error: errorEtat } = useEtatDesLieuxById(etatId);

  useEffect(() => {
    if (etatData) {
      setInitialEtatDesLieux(etatData as EtatDesLieux);
      setTravauxAFaire(etatData.travaux_a_faire || false);
      setDescriptionTravaux(etatData.description_travaux || '');
    }
  }, [etatData]);
  
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
      toast.error('Vous devez confirmer la validation avant de procéder.');
      return;
    }

    let dateSortieToUpdate: string | null = new Date().toISOString().split('T')[0];
    let toastMessage = 'État des lieux finalisé avec succès';

    if (initialEtatDesLieux?.date_sortie) {
      // If it was already finalized, keep the original date_sortie unless explicitly changed
      // For now, we assume GeneralStep would handle explicit changes to date_sortie.
      // Here, we preserve it.
      dateSortieToUpdate = initialEtatDesLieux.date_sortie;
      toastMessage = 'Modifications de l\'état des lieux sauvegardées';
    }
    
    // If GeneralStep has cleared date_sortie, this path should ideally not be taken.
    // Or, if it is, we might need to get the current date_sortie from GeneralStep's state.
    // This simplified logic assumes date_sortie is either new or preserved.
    // A more robust solution would involve GeneralStep communicating its date_sortie value.

    updateEtatSortieMutation.mutate(
      { 
        id: etatId, 
        date_sortie: dateSortieToUpdate, // This will be today if new, or existing if already finalized
        statut: 'finalise', // Always 'finalise' when this step is completed
        travaux_a_faire: travauxAFaire,
        description_travaux: travauxAFaire ? descriptionTravaux : null
      },
      {
        onSuccess: () => {
          toast.success(toastMessage);
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
                {initialEtatDesLieux?.date_sortie ? 'Confirmer les modifications' : 'Finaliser l\'état des lieux'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                {initialEtatDesLieux?.date_sortie
                  ? `Cet état des lieux a été initialement finalisé le ${new Date(initialEtatDesLieux.date_sortie).toLocaleDateString()}. En confirmant, vous sauvegardez les modifications apportées.`
                  : "Veuillez confirmer que toutes les informations sont correctes pour finaliser cet état des lieux de sortie."}
              </p>
              {initialEtatDesLieux?.date_sortie && (
                <p className="text-sm text-slate-600">
                  La date de sortie enregistrée restera le <strong className='text-slate-800'>{new Date(initialEtatDesLieux.date_sortie).toLocaleDateString()}</strong>. Pour la modifier, veuillez retourner à l'étape 'Général'.
                </p>
              )}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-slate-800">Travaux à réaliser</h4>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="travaux"
                    checked={travauxAFaire}
                    onCheckedChange={setTravauxAFaire}
                  />
                  <Label htmlFor="travaux">
                    Des travaux sont nécessaires suite à cet état des lieux
                  </Label>
                </div>

                {travauxAFaire && (
                  <div className="space-y-2">
                    <Label htmlFor="description-travaux">Description des travaux à effectuer</Label>
                    <Textarea
                      id="description-travaux"
                      placeholder="Décrivez en détail les travaux à réaliser..."
                      value={descriptionTravaux}
                      onChange={(e) => setDescriptionTravaux(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="validation"
                  checked={isValidationChecked}
                  onCheckedChange={handleCheckboxChange}
                />
                <Label htmlFor="validation">
                  Je confirme que toutes les informations sont correctes et que l'état des lieux peut être {initialEtatDesLieux?.date_sortie ? 'mis à jour' : 'finalisé'}
                </Label>
              </div>
              
              <Button
                onClick={handleFinalize}
                disabled={!isValidationChecked || updateEtatSortieMutation.isPending}
                className="w-full"
              >
                {updateEtatSortieMutation.isPending
                  ? (initialEtatDesLieux?.date_sortie ? 'Sauvegarde...' : 'Finalisation...')
                  : (initialEtatDesLieux?.date_sortie ? 'Sauvegarder les modifications' : 'Finaliser l\'état des lieux')}
              </Button>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (isLoadingEtat) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Chargement des données de l'état des lieux...</p>
      </div>
    );
  }

  if (errorEtat) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erreur lors du chargement des données: {errorEtat.message}</p>
        <Button onClick={() => navigate('/')} className="mt-4">Retour au tableau de bord</Button>
      </div>
    );
  }

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
              {initialEtatDesLieux?.date_sortie ? 'Modifier l\'état des lieux de sortie' : 'État des lieux de sortie'}
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
