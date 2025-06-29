import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import FormProgress from './FormProgress';
import { toast } from '@/hooks/use-toast';
import { 
  useEtatDesLieuxById, 
  usePiecesByEtatId, 
  useReleveCompteursByEtatId,
  useClesByEtatId,
  usePartiesPrivativesByEtatId,
  useAutresEquipementsByEtatId,
  useEquipementsEnergetiquesByEtatId,
  useEquipementsChauffageByEtatId,
  useUpdateEtatSortie,
  useUpdateReleveCompteurs,
  useUpdatePiece,
  useUpdateCles,
  useUpdatePartiePrivative,
  useUpdateAutreEquipement,
  useUpdateEquipementsEnergetiques,
  useUpdateEquipementsChauffage
} from '@/hooks/useEtatDesLieux';

const STEPS = [
  { id: 'info', title: 'Informations générales', completed: false, current: true },
  { id: 'compteurs', title: 'Relevé compteurs', completed: false, current: false },
  { id: 'equipements', title: 'Équipements énergétiques', completed: false, current: false },
  { id: 'pieces', title: 'État des pièces', completed: false, current: false },
  { id: 'parties_privatives', title: 'Parties privatives', completed: false, current: false },
  { id: 'autres_equipements', title: 'Autres équipements', completed: false, current: false },
  { id: 'cles', title: 'Remise des clés', completed: false, current: false },
  { id: 'validation', title: 'Validation', completed: false, current: false },
];

const EtatSortieForm = () => {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(STEPS);
  const [dateSortie, setDateSortie] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Hooks pour récupérer les données
  const { data: etatDesLieux, isLoading: loadingEtat } = useEtatDesLieuxById(id || '');
  const { data: pieces, isLoading: loadingPieces } = usePiecesByEtatId(id || '');
  const { data: releveCompteurs } = useReleveCompteursByEtatId(id || '');
  const { data: cles } = useClesByEtatId(id || '');
  const { data: partiesPrivatives } = usePartiesPrivativesByEtatId(id || '');
  const { data: autresEquipements } = useAutresEquipementsByEtatId(id || '');
  const { data: equipementsEnergetiques } = useEquipementsEnergetiquesByEtatId(id || '');
  const { data: equipementsChauffage } = useEquipementsChauffageByEtatId(id || '');

  // Mutations
  const updateEtatSortie = useUpdateEtatSortie();
  const updateReleveCompteurs = useUpdateReleveCompteurs();
  const updatePiece = useUpdatePiece();
  const updateCles = useUpdateCles();
  const updatePartiePrivative = useUpdatePartiePrivative();
  const updateAutreEquipement = useUpdateAutreEquipement();
  const updateEquipementsEnergetiques = useUpdateEquipementsEnergetiques();
  const updateEquipementsChauffage = useUpdateEquipementsChauffage();

  // État local pour les formulaires
  const [releveData, setReleveData] = useState({
    nom_ancien_occupant: '',
    electricite_n_compteur: '',
    electricite_h_pleines: '',
    electricite_h_creuses: '',
    gaz_naturel_n_compteur: '',
    gaz_naturel_releve: '',
    eau_chaude_m3: '',
    eau_froide_m3: '',
  });

  const [equipementsEnergetiquesData, setEquipementsEnergetiquesData] = useState({
    chauffage_type: '',
    eau_chaude_type: '',
  });

  const [equipementsChauffageData, setEquipementsChauffageData] = useState({
    chaudiere_etat: '',
    chaudiere_date_dernier_entretien: '',
    ballon_eau_chaude_etat: '',
  });

  const [clesData, setClesData] = useState([
    { type_cle_badge: 'Appartement', nombre: 0, commentaires: '' },
    { type_cle_badge: 'Boîte aux lettres', nombre: 0, commentaires: '' },
    { type_cle_badge: 'Badge accès', nombre: 0, commentaires: '' },
    { type_cle_badge: 'Cave', nombre: 0, commentaires: '' },
    { type_cle_badge: 'Parking', nombre: 0, commentaires: '' },
  ]);

  const [partiesPrivativesData, setPartiesPrivativesData] = useState([
    { type_partie: 'Cave', etat_sortie: '', numero: '', commentaires: '' },
    { type_partie: 'Parking / Box / Garage', etat_sortie: '', numero: '', commentaires: '' },
    { type_partie: 'Jardin', etat_sortie: '', numero: '', commentaires: '' },
    { type_partie: 'Balcon / Terrasse', etat_sortie: '', numero: '', commentaires: '' },
  ]);

  const [autresEquipementsData, setAutresEquipementsData] = useState([
    { equipement: 'Sonnette / Interphone', etat_sortie: '', commentaires: '' },
    { equipement: 'Boîte aux lettres', etat_sortie: '', commentaires: '' },
    { equipement: 'Internet', etat_sortie: '', commentaires: '' },
    { equipement: 'Antenne TV', etat_sortie: '', commentaires: '' },
    { equipement: 'Digicode', etat_sortie: '', commentaires: '' },
  ]);

  const [piecesData, setPiecesData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (etatDesLieux?.date_sortie) {
      setDateSortie(etatDesLieux.date_sortie);
    }
  }, [etatDesLieux]);

  useEffect(() => {
    if (releveCompteurs) {
      setReleveData({
        nom_ancien_occupant: releveCompteurs.nom_ancien_occupant || '',
        electricite_n_compteur: releveCompteurs.electricite_n_compteur || '',
        electricite_h_pleines: releveCompteurs.electricite_h_pleines || '',
        electricite_h_creuses: releveCompteurs.electricite_h_creuses || '',
        gaz_naturel_n_compteur: releveCompteurs.gaz_naturel_n_compteur || '',
        gaz_naturel_releve: releveCompteurs.gaz_naturel_releve || '',
        eau_chaude_m3: releveCompteurs.eau_chaude_m3 || '',
        eau_froide_m3: releveCompteurs.eau_froide_m3 || '',
      });
    }
  }, [releveCompteurs]);

  useEffect(() => {
    if (equipementsEnergetiques) {
      setEquipementsEnergetiquesData({
        chauffage_type: equipementsEnergetiques.chauffage_type || '',
        eau_chaude_type: equipementsEnergetiques.eau_chaude_type || '',
      });
    }
  }, [equipementsEnergetiques]);

  useEffect(() => {
    if (equipementsChauffage) {
      setEquipementsChauffageData({
        chaudiere_etat: equipementsChauffage.chaudiere_etat || '',
        chaudiere_date_dernier_entretien: equipementsChauffage.chaudiere_date_dernier_entretien || '',
        ballon_eau_chaude_etat: equipementsChauffage.ballon_eau_chaude_etat || '',
      });
    }
  }, [equipementsChauffage]);

  useEffect(() => {
    if (cles) {
      const updatedClesData = clesData.map(defaultCle => {
        const savedCle = cles.find(c => c.type_cle_badge === defaultCle.type_cle_badge);
        return savedCle ? {
          type_cle_badge: savedCle.type_cle_badge,
          nombre: savedCle.nombre || 0,
          commentaires: savedCle.commentaires || ''
        } : defaultCle;
      });
      setClesData(updatedClesData);
    }
  }, [cles]);

  useEffect(() => {
    if (partiesPrivatives) {
      const updatedPartiesData = partiesPrivativesData.map(defaultPartie => {
        const savedPartie = partiesPrivatives.find(p => p.type_partie === defaultPartie.type_partie);
        return savedPartie ? {
          type_partie: savedPartie.type_partie,
          etat_sortie: savedPartie.etat_sortie || '',
          numero: savedPartie.numero || '',
          commentaires: savedPartie.commentaires || ''
        } : defaultPartie;
      });
      setPartiesPrivativesData(updatedPartiesData);
    }
  }, [partiesPrivatives]);

  useEffect(() => {
    if (autresEquipements) {
      const updatedEquipementsData = autresEquipementsData.map(defaultEquip => {
        const savedEquip = autresEquipements.find(e => e.equipement === defaultEquip.equipement);
        return savedEquip ? {
          equipement: savedEquip.equipement,
          etat_sortie: savedEquip.etat_sortie || '',
          commentaires: savedEquip.commentaires || ''
        } : defaultEquip;
      });
      setAutresEquipementsData(updatedEquipementsData);
    }
  }, [autresEquipements]);

  useEffect(() => {
    if (pieces) {
      const initialPiecesData: { [key: string]: any } = {};
      pieces.forEach(piece => {
        initialPiecesData[piece.id] = {
          revetements_sols_sortie: piece.revetements_sols_sortie || '',
          murs_menuiseries_sortie: piece.murs_menuiseries_sortie || '',
          plafond_sortie: piece.plafond_sortie || '',
          electricite_plomberie_sortie: piece.electricite_plomberie_sortie || '',
          placards_sortie: piece.placards_sortie || '',
          sanitaires_sortie: piece.sanitaires_sortie || '',
          menuiseries_sortie: piece.menuiseries_sortie || '',
          rangements_sortie: piece.rangements_sortie || '',
          baignoire_douche_sortie: piece.baignoire_douche_sortie || '',
          eviers_robinetterie_sortie: piece.eviers_robinetterie_sortie || '',
          chauffage_tuyauterie_sortie: piece.chauffage_tuyauterie_sortie || '',
          meubles_cuisine_sortie: piece.meubles_cuisine_sortie || '',
          hotte_sortie: piece.hotte_sortie || '',
          plaque_cuisson_sortie: piece.plaque_cuisson_sortie || '',
          commentaires: piece.commentaires || '',
        };
      });
      setPiecesData(initialPiecesData);
    }
  }, [pieces]);

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
        title: "Étape suivante",
        description: `Vous êtes maintenant à l'étape: ${steps[newStep].title}`,
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
    if (id) {
      try {
        await updateEtatSortie.mutateAsync({ id, date_sortie: dateSortie || null });
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

  const handleSaveEquipementsEnergetiques = async () => {
    if (id) {
      try {
        await updateEquipementsEnergetiques.mutateAsync({
          etat_des_lieux_id: id,
          ...equipementsEnergetiquesData,
        });
        await updateEquipementsChauffage.mutateAsync({
          etat_des_lieux_id: id,
          ...equipementsChauffageData,
        });
        toast({
          title: "Équipements sauvegardés",
          description: "Les informations sur les équipements ont été enregistrées.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les équipements.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSavePiece = async (pieceId: string) => {
    try {
      await updatePiece.mutateAsync({
        id: pieceId,
        ...piecesData[pieceId],
      });
      toast({
        title: "Pièce sauvegardée",
        description: "L'état de la pièce a été enregistré avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'état de la pièce.",
        variant: "destructive",
      });
    }
  };

  const handleSaveCles = async () => {
    if (id) {
      try {
        await Promise.all(clesData.map(cle => 
          updateCles.mutateAsync({
            etat_des_lieux_id: id,
            ...cle
          })
        )); // Corrected to ensure Promise.all is correctly awaited
        toast({
          title: "Clés sauvegardées",
          description: "Les informations sur les clés ont été enregistrées.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les informations sur les clés.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSavePartiesPrivatives = async () => {
    if (id) {
      try {
        await Promise.all(partiesPrivativesData.map(partie => 
          updatePartiePrivative.mutateAsync({
            etat_des_lieux_id: id,
            ...partie
          })
        )); // Corrected to remove extraneous semicolon and ensure Promise.all is correctly awaited
        toast({
          title: "Parties privatives sauvegardées",
          description: "Les informations sur les parties privatives ont été enregistrées.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les parties privatives.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveAutresEquipements = async () => {
    if (id) {
      try {
        await Promise.all(autresEquipementsData.map(equipement => 
          updateAutreEquipement.mutateAsync({
            etat_des_lieux_id: id,
            ...equipement
          })
        )); // Corrected to ensure Promise.all is correctly awaited
        toast({
          title: "Équipements sauvegardés",
          description: "Les informations sur les autres équipements ont été enregistrées.",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les autres équipements.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFinalize = async () => {
    setFormErrors({});
    let errors: { [key: string]: string } = {};

    if (!isValidated) {
      errors.validation = "La case de validation doit être cochée pour finaliser.";
    }

    if (!etatDesLieux?.adresse_bien) {
      errors.adresse_bien = "L'adresse du bien est requise pour finaliser.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Object.values(errors).forEach(error => {
        toast({
          title: "Validation requise",
          description: error,
          variant: "destructive",
        });
      });
      return;
    }

    const finalDateSortie = dateSortie || new Date().toISOString().split('T')[0];

    if (id) {
      try {
        await updateEtatSortie.mutateAsync({
          id,
          date_sortie: finalDateSortie,
          statut: 'Terminé'
        });
        
        toast({
          title: "État des lieux finalisé",
          description: "L'état des lieux de sortie a été finalisé avec succès.",
        });
        
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        toast({
          title: "Erreur lors de la finalisation",
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
                Vérifiez les informations du bien. La date de sortie est facultative.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Adresse du bien (Requis)</Label>
                  <Input value={etatDesLieux.adresse_bien} disabled className={formErrors.adresse_bien ? 'border-red-500' : ''} />
                  {formErrors.adresse_bien && <p className="text-sm text-red-600 mt-1">{formErrors.adresse_bien}</p>}
                </div>
                <div>
                  <Label>Locataire</Label>
                  <Input value={etatDesLieux.locataire_nom || ''} disabled />
                </div>
                <div>
                  <Label>Bailleur</Label>
                  <Input value={etatDesLieux.bailleur_nom || ''} disabled />
                </div>
                <div>
                  <Label>Date d'entrée</Label>
                  <Input value={etatDesLieux.date_entree || ''} disabled />
                </div>
                <div>
                  <Label htmlFor="date_sortie">Date de sortie (Optionnel)</Label>
                  <Input 
                    id="date_sortie"
                    type="date" 
                    value={dateSortie}
                    onChange={(e) => setDateSortie(e.target.value)}
                    placeholder="Date du jour si non remplie à la finalisation"
                  />
                </div>
              </div>
              <Button onClick={handleSaveEtat}>
                Sauvegarder les informations générales
              </Button>
            </CardContent>
          </Card>
        );

      case 1: // Relevé compteurs
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relevé des compteurs (Facultatif)</CardTitle>
              <CardDescription>
                Saisissez les index des compteurs au moment de la sortie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ancien_occupant">Nom ancien occupant</Label>
                  <Input 
                    id="ancien_occupant"
                    value={releveData.nom_ancien_occupant}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      nom_ancien_occupant: e.target.value
                    }))}
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <Label htmlFor="elec_compteur">N° compteur électricité</Label>
                  <Input 
                    id="elec_compteur"
                    value={releveData.electricite_n_compteur}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      electricite_n_compteur: e.target.value
                    }))}
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <Label htmlFor="elec_pleines">Électricité - Heures pleines</Label>
                  <Input 
                    id="elec_pleines"
                    value={releveData.electricite_h_pleines}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      electricite_h_pleines: e.target.value
                    }))}
                    placeholder="Optionnel"
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
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <Label htmlFor="gaz_compteur">N° compteur gaz</Label>
                  <Input 
                    id="gaz_compteur"
                    value={releveData.gaz_naturel_n_compteur}
                    onChange={(e) => setReleveData(prev => ({
                      ...prev,
                      gaz_naturel_n_compteur: e.target.value
                    }))}
                    placeholder="Optionnel"
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
                    placeholder="Optionnel"
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
                    placeholder="Optionnel"
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
                    placeholder="Optionnel"
                  />
                </div>
              </div>
              <Button onClick={handleSaveReleve}>
                Sauvegarder le relevé
              </Button>
            </CardContent>
          </Card>
        );

      case 2: // Équipements énergétiques
        return (
          <Card>
            <CardHeader>
              <CardTitle>Équipements énergétiques (Facultatif)</CardTitle>
              <CardDescription>
                Informations sur le chauffage et les équipements énergétiques.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chauffage_type">Type de chauffage</Label>
                  <Select value={equipementsEnergetiquesData.chauffage_type} onValueChange={(value) => 
                    setEquipementsEnergetiquesData(prev => ({ ...prev, chauffage_type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Non renseigné</SelectItem>
                      <SelectItem value="electrique">Électrique</SelectItem>
                      <SelectItem value="gaz">Gaz</SelectItem>
                      <SelectItem value="collectif">Collectif</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eau_chaude_type">Type eau chaude</Label>
                  <Select value={equipementsEnergetiquesData.eau_chaude_type} onValueChange={(value) => 
                    setEquipementsEnergetiquesData(prev => ({ ...prev, eau_chaude_type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Non renseigné</SelectItem>
                      <SelectItem value="electrique">Électrique</SelectItem>
                      <SelectItem value="gaz">Gaz</SelectItem>
                      <SelectItem value="collectif">Collectif</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chaudiere_etat">État de la chaudière</Label>
                  <Select value={equipementsChauffageData.chaudiere_etat} onValueChange={(value) => 
                    setEquipementsChauffageData(prev => ({ ...prev, chaudiere_etat: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'état" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Non renseigné</SelectItem>
                      <SelectItem value="excellent">Excellent état</SelectItem>
                      <SelectItem value="bon">Bon état</SelectItem>
                      <SelectItem value="moyen">État moyen</SelectItem>
                      <SelectItem value="mauvais">Mauvais état</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chaudiere_entretien">Dernier entretien chaudière</Label>
                  <Input 
                    id="chaudiere_entretien"
                    type="date"
                    value={equipementsChauffageData.chaudiere_date_dernier_entretien}
                    onChange={(e) => setEquipementsChauffageData(prev => ({
                      ...prev,
                      chaudiere_date_dernier_entretien: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ballon_etat">État du ballon eau chaude</Label>
                  <Select value={equipementsChauffageData.ballon_eau_chaude_etat} onValueChange={(value) => 
                    setEquipementsChauffageData(prev => ({ ...prev, ballon_eau_chaude_etat: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'état" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Non renseigné</SelectItem>
                      <SelectItem value="excellent">Excellent état</SelectItem>
                      <SelectItem value="bon">Bon état</SelectItem>
                      <SelectItem value="moyen">État moyen</SelectItem>
                      <SelectItem value="mauvais">Mauvais état</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveEquipementsEnergetiques}>
                Sauvegarder les équipements
              </Button>
            </CardContent>
          </Card>
        );

      case 3: // État des pièces
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>État des pièces (Facultatif)</CardTitle>
                <CardDescription>
                  Comparez l'état d'entrée avec l'état de sortie pour chaque pièce.
                </CardDescription>
              </CardHeader>
            </Card>
            {pieces?.map((piece) => (
              <Card key={piece.id}>
                <CardHeader>
                  <CardTitle>{piece.nom_piece}</CardTitle>
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
                      {piece.electricite_plomberie_entree && (
                        <div>
                          <Label className="text-sm text-slate-600">Électricité/Plomberie</Label>
                          <Input value={piece.electricite_plomberie_entree} disabled className="bg-slate-50" />
                        </div>
                      )}
                      {/* Afficher les autres champs d'entrée selon le type de pièce */}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-slate-900">État de sortie (Facultatif)</h4>
                      <div>
                        <Label className="text-sm">Revêtements sols</Label>
                        <Select
                          value={piecesData[piece.id]?.revetements_sols_sortie || ''}
                          onValueChange={(value) => setPiecesData(prev => ({
                            ...prev,
                            [piece.id]: {
                              ...prev[piece.id],
                              revetements_sols_sortie: value
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Non renseigné</SelectItem>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Murs et menuiseries</Label>
                        <Select
                          value={piecesData[piece.id]?.murs_menuiseries_sortie || ''}
                          onValueChange={(value) => setPiecesData(prev => ({
                            ...prev,
                            [piece.id]: {
                              ...prev[piece.id],
                              murs_menuiseries_sortie: value
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Non renseigné</SelectItem>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Plafond</Label>
                        <Select
                          value={piecesData[piece.id]?.plafond_sortie || ''}
                          onValueChange={(value) => setPiecesData(prev => ({
                            ...prev,
                            [piece.id]: {
                              ...prev[piece.id],
                              plafond_sortie: value
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Non renseigné</SelectItem>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Électricité/Plomberie</Label>
                        <Select
                          value={piecesData[piece.id]?.electricite_plomberie_sortie || ''}
                          onValueChange={(value) => setPiecesData(prev => ({
                            ...prev,
                            [piece.id]: {
                              ...prev[piece.id],
                              electricite_plomberie_sortie: value
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'état" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Non renseigné</SelectItem>
                            <SelectItem value="excellent">Excellent état</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="moyen">État moyen</SelectItem>
                            <SelectItem value="mauvais">Mauvais état</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Champs spécifiques au type de pièce */}
                      {(piece.nom_piece === 'Salon / Pièce à vivre' || piece.nom_piece === 'WC') && (
                        <div>
                          <Label className="text-sm">Placards</Label>
                          <Select
                            value={piecesData[piece.id]?.placards_sortie || ''}
                            onValueChange={(value) => setPiecesData(prev => ({
                              ...prev,
                              [piece.id]: {
                                ...prev[piece.id],
                                placards_sortie: value
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'état" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Non renseigné</SelectItem>
                              <SelectItem value="excellent">Excellent état</SelectItem>
                              <SelectItem value="bon">Bon état</SelectItem>
                              <SelectItem value="moyen">État moyen</SelectItem>
                              <SelectItem value="mauvais">Mauvais état</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {piece.nom_piece === 'WC' && (
                        <div>
                          <Label className="text-sm">Sanitaires</Label>
                          <Select
                            value={piecesData[piece.id]?.sanitaires_sortie || ''}
                            onValueChange={(value) => setPiecesData(prev => ({
                              ...prev,
                              [piece.id]: {
                                ...prev[piece.id],
                                sanitaires_sortie: value
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'état" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Non renseigné</SelectItem>
                              <SelectItem value="excellent">Excellent état</SelectItem>
                              <SelectItem value="bon">Bon état</SelectItem>
                              <SelectItem value="moyen">État moyen</SelectItem>
                              <SelectItem value="mauvais">Mauvais état</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(piece.nom_piece === 'Salle de bain' || piece.nom_piece === 'Coin cuisine') && (
                        <div>
                          <Label className="text-sm">Menuiseries</Label>
                          <Select
                            value={piecesData[piece.id]?.menuiseries_sortie || ''}
                            onValueChange={(value) => setPiecesData(prev => ({
                              ...prev,
                              [piece.id]: {
                                ...prev[piece.id],
                                menuiseries_sortie: value
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'état" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Non renseigné</SelectItem>
                              <SelectItem value="excellent">Excellent état</SelectItem>
                              <SelectItem value="bon">Bon état</SelectItem>
                              <SelectItem value="moyen">État moyen</SelectItem>
                              <SelectItem value="mauvais">Mauvais état</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {piece.nom_piece === 'Salle de bain' && (
                        <>
                          <div>
                            <Label className="text-sm">Rangements</Label>
                            <Select
                              value={piecesData[piece.id]?.rangements_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  rangements_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Baignoire/Douche</Label>
                            <Select
                              value={piecesData[piece.id]?.baignoire_douche_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  baignoire_douche_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                           <div>
                            <Label className="text-sm">Éviers/Robinetterie</Label>
                            <Select
                              value={piecesData[piece.id]?.eviers_robinetterie_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  eviers_robinetterie_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {piece.nom_piece === 'Coin cuisine' && (
                        <>
                          <div>
                            <Label className="text-sm">Éviers/Robinetterie</Label>
                            <Select
                              value={piecesData[piece.id]?.eviers_robinetterie_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  eviers_robinetterie_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Chauffage/Tuyauterie</Label>
                            <Select
                              value={piecesData[piece.id]?.chauffage_tuyauterie_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  chauffage_tuyauterie_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Meubles de cuisine</Label>
                            <Select
                              value={piecesData[piece.id]?.meubles_cuisine_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  meubles_cuisine_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Hotte</Label>
                            <Select
                              value={piecesData[piece.id]?.hotte_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  hotte_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Plaque de cuisson</Label>
                            <Select
                              value={piecesData[piece.id]?.plaque_cuisson_sortie || ''}
                              onValueChange={(value) => setPiecesData(prev => ({
                                ...prev,
                                [piece.id]: {
                                  ...prev[piece.id],
                                  plaque_cuisson_sortie: value
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner l'état" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Non renseigné</SelectItem>
                                <SelectItem value="excellent">Excellent état</SelectItem>
                                <SelectItem value="bon">Bon état</SelectItem>
                                <SelectItem value="moyen">État moyen</SelectItem>
                                <SelectItem value="mauvais">Mauvais état</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-4 lg:col-span-1"> {/* Commentaires sur une colonne */}
                       <h4 className="font-medium text-slate-900">Commentaires (Sortie)</h4>
                      <div>
                        <Label htmlFor={`commentaires_sortie_${piece.id}`} className="text-sm">
                          Commentaires généraux sur la pièce
                        </Label>
                        <Textarea
                          id={`commentaires_sortie_${piece.id}`}
                          value={piecesData[piece.id]?.commentaires || ''}
                          onChange={(e) => setPiecesData(prev => ({
                            ...prev,
                            [piece.id]: {
                              ...prev[piece.id],
                              commentaires: e.target.value
                            }
                          }))}
                          placeholder="Ajouter des commentaires sur l'état de sortie de la pièce"
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleSavePiece(piece.id)} className="mt-4">
                    Sauvegarder cette pièce
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 4: // Parties privatives
        return (
          <Card>
            <CardHeader>
              <CardTitle>Parties privatives (Facultatif)</CardTitle>
              <CardDescription>
                Indiquez l'état des parties privatives à la sortie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {partiesPrivativesData.map((partie, index) => (
                <div key={index} className="p-4 border rounded-md space-y-3">
                  <h4 className="font-medium">{partie.type_partie}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>État à la sortie</Label>
                      <Select
                        value={partie.etat_sortie}
                        onValueChange={(value) => {
                          const updated = [...partiesPrivativesData];
                          updated[index].etat_sortie = value;
                          setPartiesPrivativesData(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'état" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Non renseigné</SelectItem>
                          <SelectItem value="excellent">Excellent état</SelectItem>
                          <SelectItem value="bon">Bon état</SelectItem>
                          <SelectItem value="moyen">État moyen</SelectItem>
                          <SelectItem value="mauvais">Mauvais état</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Numéro / Identification</Label>
                      <Input
                        value={partie.numero}
                        onChange={(e) => {
                          const updated = [...partiesPrivativesData];
                          updated[index].numero = e.target.value;
                          setPartiesPrivativesData(updated);
                        }}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Commentaires</Label>
                    <Textarea
                      value={partie.commentaires}
                      onChange={(e) => {
                        const updated = [...partiesPrivativesData];
                        updated[index].commentaires = e.target.value;
                        setPartiesPrivativesData(updated);
                      }}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
              ))}
              <Button onClick={handleSavePartiesPrivatives}>
                Sauvegarder les parties privatives
              </Button>
            </CardContent>
          </Card>
        );

      case 5: // Autres équipements
        return (
          <Card>
            <CardHeader>
              <CardTitle>Autres équipements (Facultatif)</CardTitle>
              <CardDescription>
                Indiquez l'état des autres équipements à la sortie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {autresEquipementsData.map((equipement, index) => (
                <div key={index} className="p-4 border rounded-md space-y-3">
                  <h4 className="font-medium">{equipement.equipement}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>État à la sortie</Label>
                      <Select
                        value={equipement.etat_sortie}
                        onValueChange={(value) => {
                          const updated = [...autresEquipementsData];
                          updated[index].etat_sortie = value;
                          setAutresEquipementsData(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner l'état" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Non renseigné</SelectItem>
                          <SelectItem value="excellent">Excellent état</SelectItem>
                          <SelectItem value="bon">Bon état</SelectItem>
                          <SelectItem value="moyen">État moyen</SelectItem>
                          <SelectItem value="mauvais">Mauvais état</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Commentaires</Label>
                      <Textarea
                        value={equipement.commentaires}
                        onChange={(e) => {
                          const updated = [...autresEquipementsData];
                          updated[index].commentaires = e.target.value;
                          setAutresEquipementsData(updated);
                        }}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={handleSaveAutresEquipements}>
                Sauvegarder les autres équipements
              </Button>
            </CardContent>
          </Card>
        );

      case 6: // Remise des clés
        return (
          <Card>
            <CardHeader>
              <CardTitle>Remise des clés (Facultatif)</CardTitle>
              <CardDescription>
                Indiquez le nombre de clés et badges restitués.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {clesData.map((cle, index) => (
                <div key={index} className="p-4 border rounded-md space-y-3">
                  <h4 className="font-medium">{cle.type_cle_badge}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre restitué</Label>
                      <Input
                        type="number"
                        value={cle.nombre}
                        onChange={(e) => {
                          const updated = [...clesData];
                          updated[index].nombre = parseInt(e.target.value, 10) || 0;
                          setClesData(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Commentaires</Label>
                      <Textarea
                        value={cle.commentaires}
                        onChange={(e) => {
                          const updated = [...clesData];
                          updated[index].commentaires = e.target.value;
                          setClesData(updated);
                        }}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={handleSaveCles}>Sauvegarder les clés</Button>
            </CardContent>
          </Card>
        );

      case 7: // Validation
        return (
          <Card>
            <CardHeader>
              <CardTitle>Validation et Finalisation</CardTitle>
              <CardDescription>
                Vérifiez toutes les informations avant de finaliser l'état des lieux de sortie.
                Assurez-vous que l'adresse du bien est renseignée à l'étape 1.
                La date de sortie sera celle du jour si non renseignée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formErrors.validation && <p className="text-sm text-red-600">{formErrors.validation}</p>}
              {formErrors.adresse_bien && <p className="text-sm text-red-600">{formErrors.adresse_bien}</p>}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validation"
                  checked={isValidated}
                  onCheckedChange={(checked) => setIsValidated(Boolean(checked))}
                  className={formErrors.validation ? 'border-red-500' : ''}
                />
                <Label htmlFor="validation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Je confirme avoir vérifié toutes les informations et souhaite finaliser cet état des lieux de sortie.
                </Label>
              </div>
              <Button onClick={handleFinalize} disabled={updateEtatSortie.isLoading}>
                {updateEtatSortie.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Finaliser l'état des lieux de sortie
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">État des Lieux de Sortie</h1>
      <p className="text-slate-600 mb-8">
        Propriété: {etatDesLieux.adresse_bien}
      </p>

      <FormProgress steps={steps} currentStep={currentStep} />

      <div className="mt-8">
        {renderStepContent()}
      </div>

      <div className="mt-8 flex justify-between">
        <Button onClick={prevStep} disabled={currentStep === 0} variant="outline">
          Précédent
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={nextStep}>Suivant</Button>
        ) : (
          <Button onClick={handleFinalize} disabled={!isValidated || updateEtatSortie.isLoading}>
            {updateEtatSortie.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Finaliser et Soumettre
          </Button>
        )}
      </div>
    </div>
  );
};

export default EtatSortieForm;
