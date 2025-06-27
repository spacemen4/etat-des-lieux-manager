
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, FileText } from 'lucide-react';

// Données mockées pour démonstration
const mockEtatsDesLieux = [
  {
    id: "1",
    adresse_bien: "123 Avenue des Champs, 75008 Paris",
    locataire_nom: "Martin Dupont",
    date_entree: "2023-01-15",
    date_sortie: null,
    status: "En cours"
  },
  {
    id: "2",
    adresse_bien: "45 Rue de la Paix, 69001 Lyon",
    locataire_nom: "Sophie Bernard",
    date_entree: "2022-06-01",
    date_sortie: "2024-05-30",
    status: "Terminé"
  },
  {
    id: "3",
    adresse_bien: "78 Boulevard Saint-Germain, 75006 Paris",
    locataire_nom: "Pierre Moreau",
    date_entree: "2023-09-01",
    date_sortie: null,
    status: "En cours"
  }
];

const Dashboard = () => {
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
            <div className="text-2xl font-bold">{mockEtatsDesLieux.length}</div>
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
            <div className="text-2xl font-bold">
              {mockEtatsDesLieux.filter(e => e.status === "En cours").length}
            </div>
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
            <div className="text-2xl font-bold">
              {mockEtatsDesLieux.filter(e => e.status === "Terminé").length}
            </div>
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
          <Button asChild>
            <a href="/new-sortie">Créer un état de sortie</a>
          </Button>
        </div>

        <div className="grid gap-4">
          {mockEtatsDesLieux.map((etat) => (
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
                      <span className="text-slate-600">{etat.locataire_nom}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Entrée: {new Date(etat.date_entree).toLocaleDateString()}</span>
                      {etat.date_sortie && (
                        <span>Sortie: {new Date(etat.date_sortie).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={etat.status === "En cours" ? "default" : "secondary"}>
                      {etat.status}
                    </Badge>
                    {etat.status === "En cours" && (
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
      </div>
    </div>
  );
};

export default Dashboard;
