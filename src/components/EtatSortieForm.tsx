
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormProgress from './FormProgress';
import { toast } from '@/hooks/use-toast';

const STEPS = [
  { id: 'info', title: 'Informations générales', completed: false, current: true },
  { id: 'compteurs', title: 'Relevé compteurs', completed: false, current: false },
  { id: 'pieces', title: 'État des pièces', completed: false, current: false },
  { id: 'cles', title: 'Remise des clés', completed: false, current: false },
  { id: 'validation', title: 'Validation', completed: false, current: false },
];

const EtatSortieForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(STEPS);
  const [formData, setFormData] = useState({
    date_sortie: '',
    releveCompteurs: {
      electricite_h_pleines: '',
      electricite_h_creuses: '',
      gaz_naturel_releve: '',
      eau_chaude_m3: '',
      eau_froide_m3: '',
    },
    pieces: {
      salon: {
        revetements_sols_sortie: '',
        murs_menuiseries_sortie: '',
        plafond_sortie: '',
        electricite_plomberie_sortie: '',
        commentaires: '',
      },
      cuisine: {
        revetements_sols_sortie: '',
        murs_menuiseries_sortie: '',
        plafond_sortie: '',
        meubles_cuisine_sortie: '',
        plaque_cuisson_sortie: '',
        commentaires: '',
      },
      salle_bain: {
        revetements_sols_sortie: '',
        murs_menuiseries_sortie: '',
        plafond_sortie: '',
        baignoire_douche_sortie: '',
        eviers_robinetterie_sortie: '',
        commentaires: '',
      },
    },
    cles: {
      appartement: { nombre: 0, commentaires: '' },
      boite_lettres: { nombre: 0, commentaires: '' },
      badge_acces: { nombre: 0, commentaires: '' },
    }
  });

  // Mock data pour l'état d'entrée
  const mockEntreeData = {
    adresse_bien: "123 Avenue des Champs, 75008 Paris",
    locataire_nom: "Martin Dupont",
    date_entree: "2023-01-15",
    pieces: {
      salon: {
        revetements_sols_entree: "Bon état",
        murs_menuiseries_entree: "Excellent état",
        plafond_entree: "Bon état",
        electricite_plomberie_entree: "Bon état",
      },
      cuisine: {
        revetements_sols_entree: "Bon état",
        murs_menuiseries_entree: "Bon état",
        plafond_entree: "Bon état",
        meubles_cuisine_entree: "Excellent état",
        plaque_cuisson_entree: "Bon état",
      },
      salle_bain: {
        revetements_sols_entree: "Bon état",
        murs_menuiseries_entree: "Bon état",
        plafond_entree: "Bon état",
        baignoire_douche_entree: "Excellent état",
        eviers_robinetterie_entree: "Bon état",
      },
    }
  };

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

  const handleSave = () => {
    toast({
      title: "État des lieux sauvegardé",
      description: "L'état des lieux de sortie a été enregistré avec succès.",
    });
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
                  <Input value={mockEntreeData.adresse_bien} disabled />
                </div>
                <div>
                  <Label>Locataire</Label>
                  <Input value={mockEntreeData.locataire_nom} disabled />
                </div>
                <div>
                  <Label>Date d'entrée</Label>
                  <Input value={mockEntreeData.date_entree} disabled />
                </div>
                <div>
                  <Label htmlFor="date_sortie">Date de sortie</Label>
                  <Input 
                    id="date_sortie"
                    type="date" 
                    value={formData.date_sortie}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      date_sortie: e.target.value
                    }))}
                  />
                </div>
              </div>
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
                    value={formData.releveCompteurs.electricite_h_pleines}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      releveCompteurs: {
                        ...prev.releveCompteurs,
                        electricite_h_pleines: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="elec_creuses">Électricité - Heures creuses</Label>
                  <Input 
                    id="elec_creuses"
                    value={formData.releveCompteurs.electricite_h_creuses}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      releveCompteurs: {
                        ...prev.releveCompteurs,
                        electricite_h_creuses: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gaz">Gaz naturel</Label>
                  <Input 
                    id="gaz"
                    value={formData.releveCompteurs.gaz_naturel_releve}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      releveCompteurs: {
                        ...prev.releveCompteurs,
                        gaz_naturel_releve: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="eau_chaude">Eau chaude (m³)</Label>
                  <Input 
                    id="eau_chaude"
                    value={formData.releveCompteurs.eau_chaude_m3}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      releveCompteurs: {
                        ...prev.releveCompteurs,
                        eau_chaude_m3: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="eau_froide">Eau froide (m³)</Label>
                  <Input 
                    id="eau_froide"
                    value={formData.releveCompteurs.eau_froide_m3}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      releveCompteurs: {
                        ...prev.releveCompteurs,
                        eau_froide_m3: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2: // État des pièces
        return (
          <div className="space-y-6">
            {Object.entries(mockEntreeData.pieces).map(([pieceKey, pieceEntree]) => {
              const pieceNames = {
                salon: 'Salon / Pièce à vivre',
                cuisine: 'Cuisine',
                salle_bain: 'Salle de bain'
              };
              
              return (
                <Card key={pieceKey}>
                  <CardHeader>
                    <CardTitle>{pieceNames[pieceKey as keyof typeof pieceNames]}</CardTitle>
                    <CardDescription>
                      Comparez l'état d'entrée avec l'état de sortie
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">État d'entrée</h4>
                        {Object.entries(pieceEntree).map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-sm text-slate-600 capitalize">
                              {key.replace(/_/g, ' ').replace('entree', '')}
                            </Label>
                            <Input value={value as string} disabled className="bg-slate-50" />
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">État de sortie</h4>
                        {Object.entries(pieceEntree).map(([key]) => {
                          const sortieKey = key.replace('entree', 'sortie');
                          return (
                            <div key={sortieKey}>
                              <Label className="text-sm capitalize">
                                {key.replace(/_/g, ' ').replace('entree', '')}
                              </Label>
                              <Select>
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
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">Commentaires</h4>
                        <Textarea 
                          placeholder="Observations particulières..."
                          className="min-h-[200px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
              {[
                { key: 'appartement', label: 'Clés appartement' },
                { key: 'boite_lettres', label: 'Clés boîte aux lettres' },
                { key: 'badge_acces', label: 'Badge accès immeuble' }
              ].map(({ key, label }) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>{label}</Label>
                  </div>
                  <div>
                    <Label htmlFor={`${key}_nombre`}>Nombre</Label>
                    <Input 
                      id={`${key}_nombre`}
                      type="number" 
                      min="0"
                      value={formData.cles[key as keyof typeof formData.cles].nombre}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cles: {
                          ...prev.cles,
                          [key]: {
                            ...prev.cles[key as keyof typeof prev.cles],
                            nombre: parseInt(e.target.value) || 0
                          }
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${key}_commentaires`}>Commentaires</Label>
                    <Input 
                      id={`${key}_commentaires`}
                      value={formData.cles[key as keyof typeof formData.cles].commentaires}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cles: {
                          ...prev.cles,
                          [key]: {
                            ...prev.cles[key as keyof typeof prev.cles],
                            commentaires: e.target.value
                          }
                        }
                      }))}
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
                  <p><strong>Bien :</strong> {mockEntreeData.adresse_bien}</p>
                  <p><strong>Locataire :</strong> {mockEntreeData.locataire_nom}</p>
                  <p><strong>Date de sortie :</strong> {formData.date_sortie || 'Non renseignée'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="validation" className="rounded" />
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
          {mockEntreeData.adresse_bien} - {mockEntreeData.locataire_nom}
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
          <Button variant="outline" onClick={handleSave}>
            Sauvegarder
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              Finaliser l'état des lieux
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
