import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, FileText, Loader2, Building2 } from 'lucide-react';
import { useEtatDesLieux } from '@/hooks/useEtatDesLieux';
import EtatDesLieuxViewer from './EtatDesLieuxViewer';

const Dashboard = () => {
  const { data: etatsDesLieux, isLoading, error } = useEtatDesLieux();
  const [selectedEtatId, setSelectedEtatId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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

  const getTypeBienLabel = (typeBien: string) => {
    const labels: Record<string, string> = {
      'studio': 'Studio',
      't2_t3': 'T2 - T3',
      't4_t5': 'T4 - T5',
      'inventaire_mobilier': 'Inventaire mobilier',
      'bureau': 'Bureau',
      'local_commercial': 'Local commercial',
      'garage_box': 'Garage / Box',
      'pieces_supplementaires': 'Pièces supplémentaires'
    };
    return labels[typeBien] || typeBien;
  };

  const handleViewEtat = (etatId: string) => {
    setSelectedEtatId(etatId);
    setIsViewerOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Tableau de bord
          </h2>
          <p className="text-slate-600">
            Gérez vos états des lieux d'entrée et de sortie
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <a href="/new-etat-des-lieux">Créer un état des lieux</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des biens</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{etatsDesLieux?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              États des lieux enregistrés
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
              États des lieux finalisés
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            États des lieux récents
          </h3>
          {etatsEnCours.length > 0 ? (
            <div className="text-sm text-slate-600">
              Sélectionnez un bien en cours pour faire l'état de sortie
            </div>
          ) : (
            <div className="text-sm text-slate-600">
              Aucun bien en cours de location
            </div>
          )}
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
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <h4 className="font-semibold text-slate-900">
                          {etat.adresse_bien}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">{etat.locataire_nom || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">{getTypeBienLabel(etat.type_bien)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {etat.date_entree && (
                          <span>Entrée: {new Date(etat.date_entree).toLocaleDateString()}</span>
                        )}
                        {etat.date_sortie && (
                          <span>Sortie: {new Date(etat.date_sortie).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-col">
                      <div className="flex gap-2">
                        <Badge variant={etat.type_etat_des_lieux === 'entree' ? "default" : "secondary"}>
                          {etat.type_etat_des_lieux === 'entree' ? 'Entrée' : 'Sortie'}
                        </Badge>
                        <Badge variant={!etat.date_sortie ? "default" : "secondary"}>
                          {!etat.date_sortie ? "En cours" : "Terminé"}
                        </Badge>
                      </div>
                      {!etat.date_sortie && etat.type_etat_des_lieux === 'entree' && (
                        <Button 
                          size="sm" 
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a href={`/sortie/${etat.id}`}>Faire l'état de sortie</a>
                        </Button>
                      )}
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
