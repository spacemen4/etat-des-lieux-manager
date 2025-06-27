import React from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, FileText, Loader2 } from 'lucide-react';
import { useEtatDesLieux } from '@/hooks/useEtatDesLieux';

const Dashboard = () => {
  const { data: etatsDesLieux, isLoading, error } = useEtatDesLieux();

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Tableau de bord
        </h2>
        <p className="text-slate-600">
          Gérez vos états des lieux d'entrée et de sortie
        </p>
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
              <Card key={etat.id} className="hover:shadow-md transition-shadow">
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
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {etat.date_entree && (
                          <span>Entrée: {new Date(etat.date_entree).toLocaleDateString()}</span>
                        )}
                        {etat.date_sortie && (
                          <span>Sortie: {new Date(etat.date_sortie).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={!etat.date_sortie ? "default" : "secondary"}>
                        {!etat.date_sortie ? "En cours" : "Terminé"}
                      </Badge>
                      {!etat.date_sortie && (
                        <Button size="sm" asChild>
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
    </div>
  );
};

export default Dashboard;
