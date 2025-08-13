import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useEtatDesLieux } from '@/hooks/useEtatDesLieux';
import { useUser, UserProvider } from '@/context/UserContext';
import { useEmployes } from '@/context/EmployeContext';
import { AuthProvider } from '@/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, User, Building2, Clock, Loader2, ChevronLeft, ChevronRight, Search, Download, Printer, Mail, Lock, FileText, LogIn, LogOut } from 'lucide-react';
import EtatDesLieuxViewer from '@/components/EtatDesLieuxViewer';
import EtatDesLieuxPrintable from '@/components/EtatDesLieuxPrintable';
import { supabase } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

const queryClient = new QueryClient();

const VueGlobale = () => {
  const { userUuid } = useUser();
  const { data: etatsDesLieux, isLoading, error } = useEtatDesLieux(userUuid);
  const { employes } = useEmployes();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtatId, setSelectedEtatId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const itemsPerPage = 10;

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

  const getEmployeLabel = useMemo(() => {
    return (employeId?: string | null) => {
      if (!employeId) return null;
      const e = employes.find(emp => emp.id === employeId);
      if (!e) return null;
      return `${e.prenom ?? ''} ${e.nom ?? ''}`.trim();
    };
  }, [employes]);

  // Filtrer et trier les états des lieux
  const filteredAndSortedEtatsDesLieux = useMemo(() => {
    if (!etatsDesLieux) return [];
    
    let filtered = etatsDesLieux;
    
    // Appliquer le filtre de recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = etatsDesLieux.filter((etat) => {
        const adresse = etat.adresse_bien?.toLowerCase() || '';
        const locataire = etat.locataire_nom?.toLowerCase() || '';
        const typeBien = getTypeBienLabel(etat.type_bien).toLowerCase();
        const employe = getEmployeLabel(etat.employe_id)?.toLowerCase() || '';
        
        return adresse.includes(searchLower) || 
               locataire.includes(searchLower) || 
               typeBien.includes(searchLower) ||
               employe.includes(searchLower);
      });
    }
    
    // Trier du plus récent au plus ancien
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date_sortie || a.date_entree || a.created_at);
      const dateB = new Date(b.date_sortie || b.date_entree || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [etatsDesLieux, searchTerm, getEmployeLabel]);

  // Calculer la pagination
  const totalPages = Math.ceil(filteredAndSortedEtatsDesLieux.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedEtatsDesLieux.slice(startIndex, endIndex);
  
  // Réinitialiser la pagination quand on recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
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

      html2pdf().from(printableContainer.firstElementChild).set(opt).output('datauristring').then(async (pdfBase64: any) => {
        document.body.removeChild(printableContainer);
        root.unmount();

        toast.info('PDF généré. Envoi de l\'e-mail...');

        const pdfData = pdfBase64.split(',')[1];

        const { error } = await supabase.functions.invoke('send-email', {
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
      }).catch((err: any) => {
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
        }, 500);
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
          <h3 className="font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in custom-scrollbar">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1">
            Vue Globale
          </h1>
          <p className="text-slate-600/80 text-sm">
            Liste complète de tous vos états des lieux triés par date
          </p>
        </div>
        
        {/* Informations de pagination */}
        <div className="text-sm text-slate-600">
          {filteredAndSortedEtatsDesLieux.length > 0 && (
            <span>
              {startIndex + 1}-{Math.min(endIndex, filteredAndSortedEtatsDesLieux.length)} sur {filteredAndSortedEtatsDesLieux.length} 
              {searchTerm ? ' résultats' : ' états des lieux'}
              {searchTerm && etatsDesLieux && filteredAndSortedEtatsDesLieux.length !== etatsDesLieux.length && (
                <span className="text-slate-500"> (sur {etatsDesLieux.length} au total)</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Rechercher par adresse, locataire, type de bien..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Liste des états des lieux */}
      {filteredAndSortedEtatsDesLieux.length === 0 && searchTerm ? (
        <Card className="glass-heavy animate-fade-in">
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold gradient-text mb-3">Aucun résultat</h3>
            <p className="text-slate-600/80 mb-8">Aucun état des lieux ne correspond à votre recherche "{searchTerm}"</p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Effacer la recherche
            </Button>
          </CardContent>
        </Card>
      ) : etatsDesLieux?.length === 0 ? (
        <Card className="glass-heavy animate-fade-in">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold gradient-text mb-3">Aucun état des lieux</h3>
            <p className="text-slate-600/80 mb-8">Commencez par créer votre premier état des lieux</p>
            <Button asChild variant="primary">
              <a href="/new-etat-des-lieux">
                Créer un état des lieux
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {currentItems.map((etat, index) => (
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
                          <span>Assigné à {getEmployeLabel(etat.employe_id)}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        Créé le {new Date(etat.created_at).toLocaleDateString()}
                      </div>
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
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  Page {currentPage} sur {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
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

export default VueGlobale;