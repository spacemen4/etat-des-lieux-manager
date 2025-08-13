import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, CheckCircle, ArrowRight, Loader2, AlertTriangle, Info, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FormProgress from '@/components/FormProgress';
import { useEtatDesLieuxById, useUpdateEtatSortie } from '@/hooks/useEtatDesLieux';
import type { EidasEtatDesLieux } from '@/types/eidasEtatDesLieux';
import { useUser } from '@/context/UserContext';

// Interface pour les étapes qui supportent la sauvegarde automatique
export interface StepRef {
  saveData: () => Promise<void>;
}


// Import des composants d'étapes
import GeneralStep from '@/components/steps/GeneralStep';
import ReleveCompteursStep from '@/components/steps/ReleveCompteursStep';
import PiecesStep from '@/components/steps/PiecesStep';
import ClesStep from '@/components/steps/ClesStep';
import PartiesPrivativesStep from '@/components/steps/PartiesPrivativesStep';
import AutresEquipementsStep from '@/components/steps/AutresEquipementsStep';
import EquipementsEnergetiquesStep from '@/components/steps/EquipementsEnergetiquesStep';
import EquipementsChauffageStep from '@/components/steps/EquipementsChauffageStep';
import { EidasSignatureCanvas, EidasSignatureData } from './EidasSignatureCanvas';

interface EtatSortieFormProps {
  etatId: string;
}

const EtatSortieForm: React.FC<EtatSortieFormProps> = ({ etatId }) => {
  const navigate = useNavigate();
  const { userUuid } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidationChecked, setIsValidationChecked] = useState(false);
  const [initialEtatDesLieux, setInitialEtatDesLieux] = useState<EidasEtatDesLieux | null>(null);
  const [travauxAFaire, setTravauxAFaire] = useState(false);
  const [descriptionTravaux, setDescriptionTravaux] = useState('');
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Références pour les étapes qui supportent la sauvegarde automatique
  const stepRefs = useRef<(StepRef | null)[]>([]);
  
  const setStepRef = (index: number, ref: StepRef | null) => {
    stepRefs.current[index] = ref;
  };

  const { data: etatData, isLoading: isLoadingEtat, error: errorEtat } = useEtatDesLieuxById(etatId, userUuid);

  useEffect(() => {
    if (etatData) {
      setInitialEtatDesLieux(etatData as EidasEtatDesLieux);
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

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Sauvegarder les données de l'étape actuelle avant de passer à la suivante
      const currentStepRef = stepRefs.current[currentStep];
      if (currentStepRef && currentStepRef.saveData) {
        try {
          setIsSavingStep(true);
          console.log(`[STEP ${currentStep}] Sauvegarde des données avant passage à l'étape suivante`);
          await currentStepRef.saveData();
          console.log(`[STEP ${currentStep}] Données sauvegardées avec succès`);
          toast.success(`Étape ${currentStep + 1} sauvegardée avec succès`);
        } catch (error) {
          console.error(`[STEP ${currentStep}] Erreur lors de la sauvegarde:`, error);
          toast.error(`Erreur lors de la sauvegarde de l'étape ${currentStep + 1}. Veuillez réessayer.`);
          setIsSavingStep(false);
          return; // Ne pas changer d'étape si la sauvegarde échoue
        } finally {
          setIsSavingStep(false);
        }
      }
      
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

    // Ouvrir le modal de confirmation
    setShowConfirmDialog(true);
  };

  const confirmFinalization = async () => {

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

    setShowConfirmDialog(false);
    
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
        return <GeneralStep etatId={etatId} ref={(ref) => setStepRef(0, ref)} />;
      
      case 1: // Relevé des compteurs
        return <ReleveCompteursStep etatId={etatId} ref={(ref) => setStepRef(1, ref)} />;
      
      case 2: // Pièces
        return <PiecesStep etatId={etatId} ref={(ref) => setStepRef(2, ref)} />;
      
      case 3: // Clés
        return <ClesStep etatId={etatId} ref={(ref) => setStepRef(3, ref)} />;
      
      case 4: // Parties privatives
        return <PartiesPrivativesStep etatId={etatId} ref={(ref) => setStepRef(4, ref)} />;
      
      case 5: // Autres équipements
        return <AutresEquipementsStep etatId={etatId} ref={(ref) => setStepRef(5, ref)} />;
      
      case 6: // Équipements énergétiques
        return <EquipementsEnergetiquesStep etatId={etatId} ref={(ref) => setStepRef(6, ref)} />;
      
      case 7: // Équipements de chauffage
        return <EquipementsChauffageStep etatId={etatId} ref={(ref) => setStepRef(7, ref)} />;
      
      case 8: // Finalisation
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {initialEtatDesLieux?.date_sortie ? 'Confirmer les modifications' : 'Finaliser l\'état des lieux'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {/* Alerte d'information pour la finalisation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900">Finalisation de l'état des lieux</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Vérifiez que tous les champs obligatoires sont remplis</p>
                      <p>• Assurez-vous que les signatures sont complètes</p>
                      <p>• Confirmez l'exactitude de toutes les informations</p>
                      <p className="font-medium">La confirmation ci-dessous est obligatoire pour finaliser.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  <Checkbox
                    id="validation"
                    checked={isValidationChecked}
                    onCheckedChange={handleCheckboxChange}
                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="validation" className="text-amber-900 font-medium cursor-pointer">
                    <span className="text-red-600 font-bold">* </span>
                    Je confirme que toutes les informations sont correctes et que l'état des lieux peut être {initialEtatDesLieux?.date_sortie ? 'mis à jour' : 'finalisé'}
                  </Label>
                  <p className="text-xs text-amber-700 mt-1">Cette confirmation est obligatoire pour procéder à la finalisation.</p>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-slate-800">Signatures</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EidasSignatureCanvas
                    title="Signature du locataire"
                    autoSave
                    required
                    initialSignature={{
                      signature: initialEtatDesLieux?.signature_locataire ?? '',
                      nom: initialEtatDesLieux?.signature_locataire_nom ?? '',
                      lieu: initialEtatDesLieux?.signature_locataire_lieu ?? '',
                      lu_approuve: initialEtatDesLieux?.signature_locataire_lu_approuve ?? false,
                      photo_identite: initialEtatDesLieux?.signature_locataire_photo_identite ?? '',
                      date: initialEtatDesLieux?.signature_locataire_date ?? ''
                    }}
                    onSignatureSave={(signatureData: EidasSignatureData) => {
                      updateEtatSortieMutation.mutate({
                        id: etatId,
                        signature_locataire: signatureData.signature,
                        signature_locataire_nom: signatureData.nom,
                        signature_locataire_lieu: signatureData.lieu,
                        signature_locataire_lu_approuve: signatureData.lu_approuve,
                        signature_locataire_photo_identite: signatureData.photo_identite,
                        signature_locataire_date: signatureData.date,
                      });
                    }}
                  />
                  <EidasSignatureCanvas
                    title="Signature du propriétaire/agent"
                    autoSave
                    required
                    initialSignature={{
                      signature: initialEtatDesLieux?.signature_proprietaire_agent ?? '',
                      nom: initialEtatDesLieux?.signature_proprietaire_agent_nom ?? '',
                      lieu: initialEtatDesLieux?.signature_proprietaire_agent_lieu ?? '',
                      lu_approuve: initialEtatDesLieux?.signature_proprietaire_agent_lu_approuve ?? false,
                      photo_identite: initialEtatDesLieux?.signature_proprietaire_agent_photo_identite ?? '',
                      date: initialEtatDesLieux?.signature_proprietaire_agent_date ?? ''
                    }}
                    onSignatureSave={(signatureData: EidasSignatureData) => {
                      updateEtatSortieMutation.mutate({
                        id: etatId,
                        signature_proprietaire_agent: signatureData.signature,
                        signature_proprietaire_agent_nom: signatureData.nom,
                        signature_proprietaire_agent_lieu: signatureData.lieu,
                        signature_proprietaire_agent_lu_approuve: signatureData.lu_approuve,
                        signature_proprietaire_agent_photo_identite: signatureData.photo_identite,
                        signature_proprietaire_agent_date: signatureData.date,
                      });
                    }}
                  />
                </div>
              </div>
              
              {/* Alerte d'erreur si validation non cochée */}
              {!isValidationChecked && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-medium text-red-900">Action requise</p>
                      <p className="text-sm text-red-800">
                        Vous devez confirmer que toutes les informations sont correctes avant de pouvoir finaliser l'état des lieux.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleFinalize}
                disabled={!isValidationChecked || updateEtatSortieMutation.isPending}
                className={`w-full transition-all duration-200 ${
                  !isValidationChecked 
                    ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
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
      <div className="flex items-center justify-between flex-wrap gap-4">
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
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">
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
          <Button onClick={handleNext} disabled={isSavingStep}>
            {isSavingStep ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : null}
      </div>

      {/* Modal de confirmation personnalisé */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-amber-600" />
              </div>
              {initialEtatDesLieux?.date_sortie ? 'Confirmer la sauvegarde' : 'Finaliser l\'état des lieux'}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-slate-600 leading-relaxed">
            {initialEtatDesLieux?.date_sortie 
              ? 'Vous êtes sur le point de sauvegarder les modifications de cet état des lieux. Cette action est définitive et vous ne pourrez plus modifier ce document après confirmation.'
              : 'Vous êtes sur le point de finaliser cet état des lieux. Une fois finalisé, vous ne pourrez plus le modifier.'
            }
          </DialogDescription>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-2">Êtes-vous certain de vouloir procéder ?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Cette action est irréversible</li>
                  <li>• Vérifiez que toutes les informations sont correctes</li>
                  <li>• Les signatures doivent être complètes</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Annuler
            </Button>
            <Button
              onClick={confirmFinalization}
              disabled={updateEtatSortieMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {updateEtatSortieMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {initialEtatDesLieux?.date_sortie ? 'Sauvegarde...' : 'Finalisation...'}
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  {initialEtatDesLieux?.date_sortie ? 'Sauvegarder' : 'Finaliser'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EtatSortieForm;
