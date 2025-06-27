import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import FormProgress from './FormProgress';
import { toast } from '@/hooks/use-toast';
import { 
  useEtatDesLieuxById, 
  usePiecesByEtatId, 
  useReleveCompteursByEtatId,
  useClesByEtatId,
  useUpdateEtatSortie,
  useUpdateReleveCompteurs,
  useUpdatePiece,
  useUpdateCles
} from '@/hooks/useEtatDesLieux';

const STEPS = [
  { id: 'info', title: 'Informations générales', completed: false, current: true },
  { id: 'compteurs', title: 'Relevé compteurs', completed: false, current: false },
  { id: 'pieces', title: 'État des pièces', completed: false, current: false },
  { id: 'cles', title: 'Remise des clés', completed: false, current: false },
  { id: 'validation', title: 'Validation', completed: false, current: false },
];

const EtatSortieForm = () => {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(STEPS);
  const [dateSortie, setDateSortie] = useState('');
  const [isValidated, setIsValidated] = useState(false);

  // Hooks pour récupérer les données
  const { data: etatDesLieux, isLoading: loadingEtat } = useEtatDesLieuxById(id || '');
  const { data: pieces, isLoading: loadingPieces } = usePiecesByEtatId(id || '');
  const { data: releveCompteurs } = useReleveCompteursByEtatId(id || '');
  const { data: cles } = useClesByEtatId(id || '');

  // Mutations
  const updateEtatSortie = useUpdateEtatSortie();
  const updateReleveCompteurs = useUpdateReleveCompteurs();
  const updatePiece = useUpdatePiece();
  const updateCles = useUpdateCles();

  // État local pour les formulaires
  const [releveData, setReleveData] = useState({
    electricite_h_pleines: '',
    electricite_h_creuses: '',
    gaz_naturel_releve: '',
    eau_chaude_m3: '',
    eau_froide_m3: '',
  });

  const [clesData, setClesData] = useState([
    { type_cle_badge: 'Appartement', nombre: 0, commentaires: '' },
    { type_cle_badge: 'Boîte aux lettres', nombre: 0, commentaires: '' },
    { type_cle_badge: 'Badge accès', nombre: 0, commentaires: '' },
  ]);

  useEffect(() => {
    if (etatDesLieux?.date_sortie) {
      setDateSortie(etatDesLieux.date_sortie);
    }
  }, [etatDesLieux]);

  useEffect(() => {
    if (releveCompteurs) {
      setReleveData({
        electricite_h_pleines: releveCompteurs.electricite_h_pleines || '',
        electricite_h_creuses: releveCompteurs.electricite_h_creuses || '',
        gaz_naturel_releve: releveCompteurs.gaz_naturel_releve || '',
        eau_chaude_m3: releveCompteurs.eau_chaude_m3 || '',
        eau_froide_m3: releveCompteurs.eau_froide_m3 || '',
      });
    }
  }, [releveCompteurs]);

  if (loadingEtat || loadingPieces) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!etatDesLieux) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">État des lieux non trouvé</p>
      </div>
    );
  }

  const updateSteps = (stepIndex: number) => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      completed: index < stepIndex,
      current: index === stepIndex
    })));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateSteps(newStep);
      toast({
        title: "Étape sauvegardée",
        description: "Vos données ont été enregistrées avec succès.",
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      updateSteps(newStep);
    }
  };

  const handleSaveEtat = async () => {
    if (dateSortie && id) {
      try {
        await updateEtatSortie.mutateAsync({ id, date_sortie: dateSortie });
        toast({
          title: "Date de sortie sauvegardée",
          description: "La date de sortie a été enregistrée avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la date de sortie.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveReleve = async () => {
    if (id) {
      try {
        await updateReleveCompteurs.mutateAsync({
          etat_des_lieux_id: id,
          ...releveData,
        });
        toast({
          title: "Relevé sauvegardé",
          description: "Le relevé des compteurs a été enregistré avec succès.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder le relevé des compteurs.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFinalize = async () => {
    if (!isValidated) {
      toast({
        title: "Validation requise",
        description: "Veuillez cocher la case de validation avant de finaliser.",
        variant: "destructive",
      });
      return;
    }

    if (id) {
      try {
        // Marquer l'état des lieux comme finalisé en ajoutant une date de sortie si pas déjà fait
        if (!dateSortie) {
          const today = new Date().toISOString().split('T')[0];
          await updateEtatSortie.mutateAsync({ id, date_sortie: today });
        }
        
        toast({
          title: "État des lieux finalisé",
          description: "L'état des lieux de sortie a été finalisé avec succès.",
        });
        
        // Rediriger vers le dashboard après finalisation
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de finaliser l'état des lieux.",
          variant: "destructive",
        });
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Informations générales
        return (
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Renseignez la date de sortie et vérifiez les informations du bien
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Adresse du bien</Label>
                  <Input value={etatDesLieux.adresse_bien} disabled />
                </div>
                <div>
                  <Label>Locataire</Label>
                  <Input value={etatDesLieux.locataire_nom || ''} disabled />
                </div>
                <div>
                  <Label>Date d'entrée</Label>
                  <Input value={etatDesLieux.date_entree || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="date_sortie">Date de sortie</Label>
                  <Input 
                    id="date_sortie"
                    type="date" 
                    value={dateSortie}
                    onChange={(e) => setDateSortie(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveEtat} disabled={!dateSortie}>
                Sauvegarder la date de sortie
              </Button>
            </CardContent>
          </Card>
        );

      case 1: // Relevé compteurs
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relevé des compteurs</CardTitle>
              <CardDescription>
                Saisissez les index des compteurs au moment de la sortie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="elec_pleines">Électricité - Heures pleines</Label>
                  <Input 
                    id="elec_pleines"
                    value={releveData.electricite_h_pleines}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      electricite_h_pleines: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="elec_creuses">Électricité - Heures creuses</Label>
                  <Input 
                    id="elec_creuses"
                    value={releveData.electricite_h_creuses}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      electricite_h_creuses: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gaz">Gaz naturel</Label>
                  <Input 
                    id="gaz"
                    value={releveData.gaz_naturel_releve}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      gaz_naturel_releve: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="eau_chaude">Eau chaude (m³)</Label>
                  <Input 
                    id="eau_chaude"
                    value={releveData.eau_chaude_m3}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      eau_chaude_m3: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="eau_froide">Eau froide (m³)</Label>
                  <Input 
                    id="eau_froide"
                    value={releveData.eau_froide_m3}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      eau_froide_m3: e.target.value
                    }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveReleve}>
                Sauvegarder le relevé
              </Button>
            </CardContent>
          </Card>
        );

      case 2: // État des pièces
        return (
          <div className="space-y-6">
            {pieces?.map((piece) => (
              <Card key={piece.id}>
                <CardHeader>
                  <CardTitle>{piece.nom_piece}</CardTitle>
                  <CardDescription>
                    Comparez l'état d'entrée avec l'état de sortie
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">État d'entrée</h4>
                      {piece.revetements_sols_entree && (
                        <div>
                          <Label className="text-sm text-slate-600">Revêtements sols</Label>
                          <Input value={piece.revetements_sols_entree} disabled className="bg-slate-50" />
                        </div>
                      )}
                      {piece.murs_menuiseries_entree && (
                        <div>
                          <Label className="text-sm text-slate-600">Murs menuiseries</Label>
                          <Input value={piece.murs_menuiseries_entree} disabled className="bg-slate-50" />
                        </div>
                      )}
                      {piece.plafond_entree && (
                        <div>
                          <Label className="text-sm text-slate-600">Plafond</Label>
                          <Input value={piece.plafond_entree} disabled className="bg-slate-50" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">État de sortie</h4>
                      <div>
                        <Label className="text-sm">Revêtements sols</Label>
                        <Select defaultValue={piece.revetements_sols_sortie || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Murs menuiseries</Label>
                        <Select defaultValue={piece.murs_menuiseries_sortie || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Plafond</Label>
                        <Select defaultValue={piece.plafond_sortie || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">Commentaires</h4>
                      <Textarea 
                        placeholder="Observations particulières..."
                        className="min-h-[200px]"
                        defaultValue={piece.commentaires || ''}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 3: // Remise des clés
        return (
          <Card>
            <CardHeader>
              <CardTitle>Remise des clés</CardTitle>
              <CardDescription>
                Vérifiez la restitution de toutes les clés et badges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clesData.map((cle, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>{cle.type_cle_badge}</Label>
                  </div>
                  <div>
                    <Label htmlFor={`cle_${index}_nombre`}>Nombre</Label>
                    <Input 
                      id={`cle_${index}_nombre`}
                      type="number" 
                      min="0"
                      value={cle.nombre}
                      onChange={(e) => {
                        const newClesData = [...clesData];
                        newClesData[index].nombre = parseInt(e.target.value) || 0;
                        setClesData(newClesData);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`cle_${index}_commentaires`}>Commentaires</Label>
                    <Input 
                      id={`cle_${index}_commentaires`}
                      value={cle.commentaires}
                      onChange={(e) => {
                        const newClesData = [...clesData];
                        newClesData[index].commentaires = e.target.value;
                        setClesData(newClesData);
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 4: // Validation
        return (
          <Card>
            <CardHeader>
              <CardTitle>Validation de l'état des lieux</CardTitle>
              <CardDescription>
                Vérifiez toutes les informations avant la validation finale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Résumé</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Bien :</strong> {etatDesLieux.adresse_bien}</p>
                  <p><strong>Locataire :</strong> {etatDesLieux.locataire_nom}</p>
                  <p><strong>Date de sortie :</strong> {dateSortie || 'Non renseignée'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="validation" 
                  className="rounded" 
                  checked={isValidated}
                  onChange={(e) => setIsValidated(e.target.checked)}
                />
                <Label htmlFor="validation">
                  Je certifie que toutes les informations renseignées sont exactes et que l'état des lieux a été réalisé en présence du locataire.
                </Label>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          État des lieux de sortie
        </h2>
        <p className="text-slate-600">
          {etatDesLieux.adresse_bien} - {etatDesLieux.locataire_nom}
        </p>
      </div>

      <FormProgress steps={steps} />

      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Précédent
        </Button>
        
        <div className="space-x-2">
          {currentStep === steps.length - 1 ? (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFinalize}
              disabled={!isValidated || updateEtatSortie.isPending}
            >
              {updateEtatSortie.isPending ? 'Finalisation...' : 'Finaliser l\'état des lieux'}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EtatSortieForm;
