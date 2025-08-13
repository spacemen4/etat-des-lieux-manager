import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, FileText, Loader2, Building2, LogIn, LogOut, Clock, Lock, Download, Printer, Mail } from 'lucide-react';
import { useEtatDesLieux, useRendezVous } from '@/hooks/useEtatDesLieux';
import EtatDesLieuxViewer from './EtatDesLieuxViewer';
import EtatDesLieuxPrintable from './EtatDesLieuxPrintable';
import { useUser, UserProvider } from '@/context/UserContext';
import { AuthProvider } from '@/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';
import { useEmployes } from '@/context/EmployeContext';

const queryClient = new QueryClient();

const Dashboard = () => {
  const { userUuid } = useUser();
  const { data: etatsDesLieux, isLoading: isLoadingEtats, error: errorEtats } = useEtatDesLieux(userUuid);
  const { data: rendezVous, isLoading: isLoadingRdv, error: errorRdv } = useRendezVous(userUuid);
  const { employes } = useEmployes();
  const [selectedEtatId, setSelectedEtatId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showAllTermines, setShowAllTermines] = useState(false);
  const [showAllBiens, setShowAllBiens] = useState(false);

  const isLoading = isLoadingEtats || isLoadingRdv;
  const error = errorEtats || errorRdv;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="glass-card p-8 max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
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
    };
    return labels[typeBien] || typeBien;
  };

  const getEmployeLabel = (employeId?: string | null) => {
    if (!employeId) return null;
    const e = employes.find(emp => emp.id === employeId);
    if (!e) return null;
    return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
  };

  const handleViewEtat = (etatId: string) => {
    setSelectedEtatId(etatId);
    setIsViewerOpen(true);
  };

  const generatePDF = async (etatId: string) => {
    toast.info('Préparation du document PDF...');

    const { data: etatData, error } = await supabase
      .from('etat_des_lieux')
      .select('type_etat_des_lieux, adresse_bien')
      .eq('id', etatId)
      .single();

    if (error || !etatData) {
      toast.error('Impossible de récupérer les informations pour le nom du fichier.');
      return;
    }

    const printableContainer = document.createElement('div');
    printableContainer.style.position = 'absolute';
    printableContainer.style.left = '-9999px';
    document.body.appendChild(printableContainer);

    const root = ReactDOM.createRoot(printableContainer);

    const onReady = () => {
      const opt = {
        margin: 0,
        filename: `etat-des-lieux-${etatData.type_etat_des_lieux}-${etatData.adresse_bien?.replace(/[^a-zA-Z0-9]/g, '-') || 'bien'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().from(printableContainer.firstElementChild).set(opt).save().then(() => {
        toast.success('PDF généré avec succès!');
        document.body.removeChild(printableContainer);
        root.unmount();
      }).catch((err) => {
        toast.error('Erreur lors de la génération du PDF.');
        console.error('Erreur html2pdf:', err);
        document.body.removeChild(printableContainer);
        root.unmount();
      });
    };

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UserProvider>
              <EtatDesLieuxPrintable etatId={etatId} onReady={onReady} />
            </UserProvider>
          </AuthProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
  };

  const handleEmail = async (etatId: string) => {
    // NOTE: This feature requires setting up the Resend integration.
    // See instructions in `api/send-email.ts`.
    const etat = etatsDesLieux?.find(e => e.id === etatId);
    if (!etat) {
      toast.error('État des lieux non trouvé.');
      return;
    }

    const recipientEmail = prompt('Veuillez entrer l\'adresse e-mail du destinataire :', '');

    if (!recipientEmail) {
      toast.info('Envoi de l\'e-mail annulé.');
      return;
    }

    toast.info('Génération du PDF pour l\'envoi par e-mail...');

    const printableContainer = document.createElement('div');
    printableContainer.style.position = 'absolute';
    printableContainer.style.left = '-9999px';
    document.body.appendChild(printableContainer);

    const root = ReactDOM.createRoot(printableContainer);

    const onReady = () => {
      const opt = {
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().from(printableContainer.firstElementChild).set(opt).output('datauristring').then(async (pdfBase64) => {
        document.body.removeChild(printableContainer);
        root.unmount();

        toast.info('PDF généré. Envoi de l\'e-mail...');

        // The PDF string is prefixed with `data:application/pdf;base64,`, remove it.
        const pdfData = pdfBase64.split(',')[1];

        const { data, error } = await supabase.functions.invoke('send-email', {
          body: JSON.stringify({
            to: recipientEmail,
            subject: `État des lieux pour ${etat.adresse_bien}`,
            html: `Bonjour,<br><br>Veuillez trouver ci-joint l'état des lieux pour le bien situé à ${etat.adresse_bien}.<br><br>Cordialement.`,
            attachment: pdfData,
          }),
        });

        if (error) {
          toast.error(`Erreur lors de l'envoi de l'e-mail: ${error.message}`);
        } else {
          toast.success('E-mail envoyé avec succès !');
        }
      }).catch((err) => {
        toast.error('Erreur lors de la génération du PDF pour l\'e-mail.');
        console.error('Erreur html2pdf email:', err);
        document.body.removeChild(printableContainer);
        root.unmount();
      });
    };

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UserProvider>
              <EtatDesLieuxPrintable etatId={etatId} onReady={onReady} />
            </UserProvider>
          </AuthProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
  };

  const handlePrint = (etatId: string) => {
    toast.info('Préparation de l\'impression...');
    const printableContainer = document.createElement('div');
    printableContainer.style.position = 'absolute';
    printableContainer.style.left = '-9999px';
    document.body.appendChild(printableContainer);

    const root = ReactDOM.createRoot(printableContainer);

    const onReady = () => {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDocument = printFrame.contentWindow?.document;
      if (frameDocument) {
        frameDocument.open();
        frameDocument.write('<html><head><title>État des Lieux</title>');
        // It might be necessary to copy stylesheets here if EtatDesLieuxPrintable relies on external CSS
        frameDocument.write('</head><body>');
        frameDocument.write(printableContainer.innerHTML);
        frameDocument.write('</body></html>');
        frameDocument.close();

        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          document.body.removeChild(printFrame);
          document.body.removeChild(printableContainer);
          root.unmount();
          toast.success('Impression lancée.');
        }, 500); // Timeout to ensure content is loaded in iframe
      } else {
        toast.error('Impossible de créer le cadre d\'impression.');
        document.body.removeChild(printableContainer);
        root.unmount();
      }
    };

    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UserProvider>
              <EtatDesLieuxPrintable etatId={etatId} onReady={onReady} />
            </UserProvider>
          </AuthProvider>
        </QueryClientProvider>
      </React.StrictMode>
    );
  };

  // Fonction pour vérifier si un rendez-vous a déjà un état des lieux associé
  const hasAssociatedEtatDesLieux = (rdvId: string) => {
    return etatsDesLieux?.some(etat => etat.rendez_vous_id === rdvId) || false;
  };

  return (
    <div className="space-y-8 animate-fade-in custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1">
            Tableau de bord
          </h2>
          <p className="text-slate-600/80 text-sm">
            Gérez vos états des lieux d'entrée et de sortie
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button asChild variant="success" className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700">
              <a href="/new-etat-des-lieux?type=entree" className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">État d'entrée</span>
                <span className="sm:hidden">Entrée</span>
              </a>
            </Button>
            <Button asChild variant="primary" className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700">
              <a href="/new-etat-des-lieux?type=sortie" className="flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">État de sortie</span>
                <span className="sm:hidden">Sortie</span>
              </a>
            </Button>
          </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="glass-heavy cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('total-des-biens')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium gradient-text">Total des biens</CardTitle>
            <div className="p-1 sm:p-2 rounded-lg bg-gradient-primary">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-3">
            <div className="text-2xl sm:text-3xl font-bold gradient-text">{etatsDesLieux?.length || 0}</div>
            <p className="text-xs text-muted-foreground/70 hidden sm:block">
              États des lieux
            </p>
          </CardContent>
        </Card>

        <Card className="glass-heavy cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('en-cours')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium gradient-text">En cours</CardTitle>
            <div className="p-1 sm:p-2 rounded-lg bg-gradient-warm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-orange-500">{etatsEnCours.length}</div>
            <p className="text-xs text-muted-foreground/70 hidden sm:block">
              Locations actives
            </p>
          </CardContent>
        </Card>

        <Card className="glass-heavy cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('termines')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium gradient-text">Terminés</CardTitle>
            <div className="p-1 sm:p-2 rounded-lg bg-gradient-cool">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-green-500">{etatsTermines.length}</div>
            <p className="text-xs text-muted-foreground/70 hidden sm:block">
              États finalisés
            </p>
          </CardContent>
        </Card>

        <Card className="glass-heavy cursor-pointer hover:shadow-lg transition-shadow" onClick={() => document.getElementById('rendez-vous')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium gradient-text">Rendez-vous</CardTitle>
            <div className="p-1 sm:p-2 rounded-lg bg-gradient-sunset">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-3">
            <div className="text-2xl sm:text-3xl font-bold text-blue-500">{rendezVousPlanifies.length}</div>
            <p className="text-xs text-muted-foreground/70 hidden sm:block">
              Rendez-vous planifiés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Rendez-vous planifiés */}
      {rendezVousPlanifies.length > 0 && (
        <div id="rendez-vous">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-6">
            Rendez-vous planifiés
          </h3>
          <div className="grid gap-4">
            {rendezVousPlanifies.map((rdv, index) => (
              <Card key={rdv.id} className="glass-light card-hover-subtle animate-slide-in-left border-orange-200/30" style={{animationDelay: `${index * 0.1}s`}}>
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
                      {rdv.employe_id && getEmployeLabel(rdv.employe_id) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User className="h-3 w-3" />
                          <span>Assigné: {getEmployeLabel(rdv.employe_id)}</span>
                        </div>
                      )}
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
                          className="w-full bg-blue-600 hover:bg-blue-700"
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

      {/* Section En cours */}
      {etatsEnCours.length > 0 && (
        <div id="en-cours">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-6">
            États des lieux en cours
          </h3>
          <div className="grid gap-4">
            {etatsEnCours.map((etat, index) => (
              <Card key={etat.id} className="glass-light card-hover cursor-pointer animate-slide-up" style={{animationDelay: `${index * 0.05}s`}} onClick={() => handleViewEtat(etat.id)}>
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
                      </div>
                      {etat.employe_id && getEmployeLabel(etat.employe_id) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <User className="h-3 w-3" />
                          <span>Dernière action par {getEmployeLabel(etat.employe_id)}</span>
                        </div>
                      )}
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
                        <Badge variant="default">En cours</Badge>
                        {etat.travaux_a_faire && (
                          <Badge variant="destructive">Travaux</Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-2 w-full sm:w-auto">
                        <Button 
                          size="sm" 
                          asChild
                          className={etat.type_etat_des_lieux === 'entree' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div id="total-des-biens">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-2">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">
            Total des biens
          </h3>
        </div>

        {etatsDesLieux?.length === 0 ? (
          <Card className="glass-heavy animate-fade-in">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-neon rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold gradient-text mb-3 animate-pulse-soft">Aucun état des lieux</h3>
              <p className="text-slate-600/80 mb-8 backdrop-blur-sm">Commencez par créer votre premier état des lieux</p>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="primary" size="sm" className="micro-bounce">
                  <a href="/new-etat-des-lieux?type=entree">
                    <LogIn className="h-4 w-4 mr-2" />
                    État d'entrée
                  </a>
                </Button>
                <Button asChild variant="secondary" size="sm" className="micro-bounce">
                  <a href="/new-etat-des-lieux?type=sortie">
                    <LogOut className="h-4 w-4 mr-2" />
                    État de sortie
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {(showAllBiens ? etatsDesLieux : etatsDesLieux?.slice(0, 2))?.map((etat, index) => (
              <Card key={etat.id} className="glass-light card-hover cursor-pointer animate-slide-up" style={{animationDelay: `${index * 0.05}s`}} onClick={() => handleViewEtat(etat.id)}>
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
                      {etat.employe_id && getEmployeLabel(etat.employe_id) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <User className="h-3 w-3" />
                          <span>Dernière action par {getEmployeLabel(etat.employe_id)}</span>
                        </div>
                      )}
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
                            className={etat.type_etat_des_lieux === 'entree' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}
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
                                  handlePrint(etat.id);
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
                                  handleEmail(etat.id);
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
          {etatsDesLieux && etatsDesLieux.length > 2 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllBiens(!showAllBiens)}
                className="w-auto"
              >
                {showAllBiens ? 'Voir moins' : `+Voir plus (${etatsDesLieux.length - 2})`}
              </Button>
            </div>
          )}
        )}
      </div>

      {/* Section Terminés */}
      {etatsTermines.length > 0 && (
        <div id="termines">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-2">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">
              États des lieux terminés
            </h3>
          </div>
          <div className="grid gap-4">
            {(showAllTermines ? etatsTermines : etatsTermines.slice(0, 2)).map((etat, index) => (
              <Card key={etat.id} className="glass-light card-hover cursor-pointer animate-slide-up" style={{animationDelay: `${index * 0.05}s`}} onClick={() => handleViewEtat(etat.id)}>
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
                      {etat.employe_id && getEmployeLabel(etat.employe_id) && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <User className="h-3 w-3" />
                          <span>Dernière action par {getEmployeLabel(etat.employe_id)}</span>
                        </div>
                      )}
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
                        <Badge variant="secondary">Terminé</Badge>
                        {etat.travaux_a_faire && (
                          <Badge variant="destructive">Travaux</Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-2 w-full sm:w-auto">
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
                              Visualiser
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
                                handlePrint(etat.id);
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
                                handleEmail(etat.id);
                              }}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {etatsTermines.length > 2 && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllTermines(!showAllTermines)}
                className="w-auto"
              >
                {showAllTermines ? 'Voir moins' : `+Voir plus (${etatsTermines.length - 2})`}
              </Button>
            </div>
          )}
        </div>
      )}

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