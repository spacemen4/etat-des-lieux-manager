import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, FileText, Loader2, Building2, Plus, LogIn, LogOut, Clock, CheckCircle, AlertCircle, Lock, Download, Printer, Mail } from 'lucide-react';
import { useEtatDesLieux, useRendezVous } from '@/hooks/useEtatDesLieux';
import EtatDesLieuxViewer from './EtatDesLieuxViewer';
import { useUser } from '@/context/UserContext';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

const Dashboard = () => {
  const { userUuid } = useUser();
  console.log('[DASHBOARD] userUuid:', userUuid);
  
  const { data: etatsDesLieux, isLoading: isLoadingEtats, error: errorEtats } = useEtatDesLieux(userUuid);
  console.log('[DASHBOARD] etatsDesLieux:', etatsDesLieux, 'isLoadingEtats:', isLoadingEtats, 'errorEtats:', errorEtats);
  
  const { data: rendezVous, isLoading: isLoadingRdv, error: errorRdv } = useRendezVous(userUuid);
  console.log('[DASHBOARD] rendezVous:', rendezVous, 'isLoadingRdv:', isLoadingRdv, 'errorRdv:', errorRdv);
  
  const [selectedEtatId, setSelectedEtatId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const isLoading = isLoadingEtats || isLoadingRdv;
  const error = errorEtats || errorRdv;
  
  console.log('[DASHBOARD] Final state - isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erreur lors du chargement des données: {error.message}</p>
      </div>
    );
  }

  const etatsEnCours = etatsDesLieux?.filter(e => !e.date_sortie) || [];
  const etatsTermines = etatsDesLieux?.filter(e => e.date_sortie) || [];
  const rendezVousPlanifies = rendezVous?.filter(rv => rv.statut === 'planifie') || [];

  const getTypeBienLabel = (typeBien: string) => {
    const labels: Record<string, string> = {
      'studio': 'Studio',
      't2_t3': 'T2 - T3',
      't4_t5': 'T4 - T5',
      'inventaire_mobilier': 'Inventaire mobilier',
      'bureau': 'Bureau',
      'local_commercial': 'Local commercial',
      'garage_box': 'Garage / Box',
      'pieces_supplementaires': 'Pièces supplémentaires',
      't2-t3': 'T2 - T3',
      't4-t5': 'T4 - T5',
      'mobilier': 'Inventaire mobilier',
      'local': 'Local commercial',
      'garage': 'Garage / Box',
      'pieces-supplementaires': 'Pièces supplémentaires'
    };
    return labels[typeBien] || typeBien;
  };

  const handleViewEtat = (etatId: string) => {
    setSelectedEtatId(etatId);
    setIsViewerOpen(true);
  };

  const generatePDF = async (etatId: string) => {
    try {
      toast.info('Génération du PDF en cours...');
      
      // Récupérer les données complètes de l'état des lieux
      const { data: etatData, error } = await supabase
        .from('etat_des_lieux')
        .select('*')
        .eq('id', etatId)
        .single();

      if (error) throw error;

      // Créer le contenu HTML pour le PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="color: #333; margin: 0;">ÉTAT DES LIEUX</h1>
            <h2 style="color: #666; margin: 10px 0;">${etatData.type_etat_des_lieux === 'entree' ? "D'ENTRÉE" : "DE SORTIE"}</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="background-color: #f0f0f0; padding: 10px; margin: 0 0 15px 0;">Informations du bien</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 200px;">Adresse</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${etatData.adresse_bien || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Type de bien</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${getTypeBienLabel(etatData.type_bien)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date d'entrée</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${etatData.date_entree ? new Date(etatData.date_entree).toLocaleDateString() : 'Non renseigné'}</td>
              </tr>
              ${etatData.date_sortie ? `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date de sortie</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(etatData.date_sortie).toLocaleDateString()}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="background-color: #f0f0f0; padding: 10px; margin: 0 0 15px 0;">Informations locataire</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 200px;">Nom</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${etatData.locataire_nom || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Téléphone</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${etatData.locataire_telephone || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${etatData.locataire_email || 'Non renseigné'}</td>
              </tr>
            </table>
          </div>

          ${etatData.travaux_a_faire ? `
          <div style="margin-bottom: 30px;">
            <h3 style="background-color: #ffe6e6; padding: 10px; margin: 0 0 15px 0; color: #d32f2f;">Travaux à effectuer</h3>
            <p style="padding: 10px; border: 1px solid #ddd; background-color: #fff5f5;">
              ${etatData.description_travaux || 'Travaux nécessaires sans description détaillée.'}
            </p>
          </div>
          ` : ''}

          ${etatData.signature_locataire || etatData.signature_proprietaire_agent ? `
          <div style="margin-top: 40px;">
            <h3 style="background-color: #f0f0f0; padding: 10px; margin: 0 0 15px 0;">Signatures</h3>
            <div style="display: flex; justify-content: space-between;">
              ${etatData.signature_locataire ? `
              <div style="text-align: center; width: 45%;">
                <p style="font-weight: bold; margin-bottom: 10px;">Signature du locataire</p>
                <img src="${etatData.signature_locataire}" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd;" />
              </div>
              ` : ''}
              ${etatData.signature_proprietaire_agent ? `
              <div style="text-align: center; width: 45%;">
                <p style="font-weight: bold; margin-bottom: 10px;">Signature du propriétaire/agent</p>
                <img src="${etatData.signature_proprietaire_agent}" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd;" />
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            <p>Document généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      `;

      // Configuration pour html2pdf
      const opt = {
        margin: 1,
        filename: `etat-des-lieux-${etatData.type_etat_des_lieux}-${etatData.adresse_bien?.replace(/[^a-zA-Z0-9]/g, '-') || 'bien'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Générer et télécharger le PDF
      await html2pdf().set(opt).from(htmlContent).save();
      
      toast.success('PDF généré avec succès!');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  // Fonction pour vérifier si un rendez-vous a déjà un état des lieux associé
  const hasAssociatedEtatDesLieux = (rdvId: string) => {
    return etatsDesLieux?.some(etat => etat.rendez_vous_id === rdvId) || false;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            Tableau de bord
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Gérez vos états des lieux d'entrée et de sortie
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button asChild className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial">
            <a href="/new-etat-des-lieux?type=entree" className="flex items-center justify-center gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">État d'entrée</span>
              <span className="sm:hidden">Entrée</span>
            </a>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial">
            <a href="/new-etat-des-lieux?type=sortie" className="flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">État de sortie</span>
              <span className="sm:hidden">Sortie</span>
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des biens</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{etatsDesLieux?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              États des lieux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{etatsEnCours.length}</div>
            <p className="text-xs text-muted-foreground">
              Locations actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{etatsTermines.length}</div>
            <p className="text-xs text-muted-foreground">
              États finalisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rendezVousPlanifies.length}</div>
            <p className="text-xs text-muted-foreground">
              Rendez-vous planifiés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Rendez-vous planifiés */}
      {rendezVousPlanifies.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-6">
            Rendez-vous planifiés
          </h3>
          <div className="grid gap-4">
            {rendezVousPlanifies.map((rdv) => (
              <Card key={rdv.id} className="hover:shadow-md transition-shadow border-orange-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <h4 className="font-semibold text-slate-900">
                          {rdv.description || 'Rendez-vous état des lieux'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">
                          {rdv.adresse} {rdv.code_postal && `, ${rdv.code_postal}`} {rdv.ville}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">{rdv.nom_contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">{getTypeBienLabel(rdv.type_bien)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 pt-2">
                        <span>Date: {new Date(rdv.date).toLocaleDateString()}</span>
                        <span>Heure: {rdv.heure}</span>
                        {rdv.duree && <span>Durée: {rdv.duree}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          {rdv.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}
                        </Badge>
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          Planifié
                        </Badge>
                      </div>
                      <div className="flex w-full sm:w-auto mt-2">
                        <Button 
                          size="sm" 
                          asChild
                          className="bg-orange-600 hover:bg-orange-700 w-full"
                        >
                          <a href={`/new-etat-des-lieux?type=${rdv.type_etat_des_lieux}&rdv=${rdv.id}`} className="flex items-center justify-center gap-1">
                            <FileText className="h-3 w-3" />
                            Faire l'état des lieux
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-2">
          <h3 className="text-xl font-semibold text-slate-900">
            États des lieux récents
          </h3>
          <p className="text-sm text-slate-600">
            {etatsEnCours.length > 0
              ? "Sélectionnez un bien pour voir le détail ou faire une sortie"
              : "Aucun bien en cours de location"}
          </p>
        </div>

        {etatsDesLieux?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun état des lieux trouvé</p>
              <p className="text-slate-500 text-sm">Commencez par créer votre premier état des lieux</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {etatsDesLieux?.map((etat) => (
              <Card key={etat.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewEtat(etat.id)}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <h4 className="font-semibold text-slate-900">
                          {etat.adresse_bien}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">{etat.locataire_nom || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">{getTypeBienLabel(etat.type_bien)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-slate-500 pt-2">
                        {etat.date_entree && (
                          <span>Entrée: {new Date(etat.date_entree).toLocaleDateString()}</span>
                        )}
                        {etat.date_sortie && (
                          <span>Sortie: {new Date(etat.date_sortie).toLocaleDateString()}</span>
                        )}
                      </div>
                      {etat.rendez_vous_id && (() => {
                        const rdvAssocie = rendezVous?.find(rdv => rdv.id === etat.rendez_vous_id);
                        if (rdvAssocie) {
                          return (
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>Lié au RDV du {new Date(rdvAssocie.date).toLocaleDateString()}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={etat.type_etat_des_lieux === 'entree' ? "default" : "secondary"}>
                          {etat.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}
                        </Badge>
                        <Badge variant={!etat.date_sortie ? "default" : "secondary"}>
                          {!etat.date_sortie ? "En cours" : "Terminé"}
                        </Badge>
                        {etat.travaux_a_faire && (
                          <Badge variant="destructive">Travaux</Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-2 w-full sm:w-auto">
                        {!etat.date_sortie && (
                          <Button 
                            size="sm" 
                            asChild
                            className={etat.type_etat_des_lieux === 'entree' ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a href={`/sortie/${etat.id}`} className="flex items-center justify-center gap-1">
                              {etat.type_etat_des_lieux === 'entree' ? (
                                <>
                                  <LogIn className="h-3 w-3" />
                                  Faire l'entrée
                                </>
                              ) : (
                                <>
                                  <LogOut className="h-3 w-3" />
                                  Faire la sortie
                                </>
                              )}
                            </a>
                          </Button>
                        )}
                        {etat.date_sortie && (
                          <div className="flex flex-col gap-2 w-full">
                            {etat.signature_locataire && etat.signature_proprietaire_agent ? (
                              <div className="flex items-center justify-center gap-1 text-slate-500 text-sm py-2">
                                <Lock className="h-3 w-3" />
                                <span>Signé et verrouillé</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="border-slate-400 hover:bg-slate-100 text-slate-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a href={`/sortie/${etat.id}`} className="flex items-center justify-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Modifier
                                </a>
                              </Button>
                            )}
                            <div className="flex gap-2 w-full">
                              <Badge 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-secondary/80 text-center py-1 px-2 flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEtat(etat.id);
                                }}
                              >
                                Visualiser le détail de l'état des lieux terminé
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-400 hover:bg-slate-100 text-slate-700 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generatePDF(etat.id);
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-400 hover:bg-slate-100 text-slate-700 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement print functionality
                                  window.print();
                                }}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-400 hover:bg-slate-100 text-slate-700 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement email sending functionality
                                  console.log('Send email for etat:', etat.id);
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EtatDesLieuxViewer 
        etatId={selectedEtatId}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedEtatId(null);
        }}
      />
    </div>
  );
};

export default Dashboard;