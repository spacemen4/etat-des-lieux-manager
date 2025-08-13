import React, { useState, useMemo } from 'react';
import { useEtatDesLieux } from '@/hooks/useEtatDesLieux';
import { useUser } from '@/context/UserContext';
import { useEmployes } from '@/context/EmployeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Building2, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const VueGlobale = () => {
  const { userUuid } = useUser();
  const { data: etatsDesLieux, isLoading, error } = useEtatDesLieux(userUuid);
  const { employes } = useEmployes();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Trier les états des lieux du plus récent au plus ancien
  const sortedEtatsDesLieux = useMemo(() => {
    if (!etatsDesLieux) return [];
    return [...etatsDesLieux].sort((a, b) => {
      const dateA = new Date(a.date_sortie || a.date_entree || a.created_at);
      const dateB = new Date(b.date_sortie || b.date_entree || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [etatsDesLieux]);

  // Calculer la pagination
  const totalPages = Math.ceil(sortedEtatsDesLieux.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedEtatsDesLieux.slice(startIndex, endIndex);

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

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
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
          {sortedEtatsDesLieux.length > 0 && (
            <span>
              {startIndex + 1}-{Math.min(endIndex, sortedEtatsDesLieux.length)} sur {sortedEtatsDesLieux.length} états des lieux
            </span>
          )}
        </div>
      </div>

      {/* Liste des états des lieux */}
      {sortedEtatsDesLieux.length === 0 ? (
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
              <Card key={etat.id} className="glass-light card-hover animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
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
                      <div className="text-xs text-slate-500 mt-1">
                        Créé le {new Date(etat.created_at).toLocaleDateString()}
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
    </div>
  );
};

export default VueGlobale;