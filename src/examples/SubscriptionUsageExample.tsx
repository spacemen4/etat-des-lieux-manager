// Exemple d'utilisation du système de subscription dans vos composants existants

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import SubscriptionLimits from '@/components/SubscriptionLimits';
import { useSubscription } from '@/context/SubscriptionContext';

// Exemple 1: Bouton pour créer un nouveau bien
const CreateBienButton = () => {
  const handleCreateBien = () => {
    // Logique pour créer un bien
    console.log('Création d\'un nouveau bien');
  };

  return (
    <SubscriptionGuard feature="createBien">
      <Button onClick={handleCreateBien} className="btn-gradient">
        <Plus className="h-4 w-4 mr-2" />
        Créer un bien
      </Button>
    </SubscriptionGuard>
  );
};

// Exemple 2: Bouton pour créer un nouvel état des lieux
const CreateEtatDesLieuxButton = () => {
  const handleCreateEtat = () => {
    // Logique pour créer un état des lieux
    console.log('Création d\'un nouvel état des lieux');
  };

  return (
    <SubscriptionGuard feature="createEtatDesLieux">
      <Button onClick={handleCreateEtat} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Nouvel état des lieux
      </Button>
    </SubscriptionGuard>
  );
};

// Exemple 3: Composant pour ajouter des photos avec vérification
const PhotoUploadSection = ({ bienId }: { bienId: string }) => {
  const handleAddPhotos = (files: FileList) => {
    // Logique pour ajouter des photos
    console.log(`Ajout de ${files.length} photos au bien ${bienId}`);
  };

  return (
    <SubscriptionGuard 
      feature="addPhotos" 
      bienId={bienId}
      photosToAdd={5} // Vérifier si on peut ajouter 5 photos
    >
      <input 
        type="file" 
        multiple 
        accept="image/*"
        onChange={(e) => e.target.files && handleAddPhotos(e.target.files)}
        className="hidden"
        id="photo-upload"
      />
      <label htmlFor="photo-upload" className="cursor-pointer">
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter des photos
        </Button>
      </label>
    </SubscriptionGuard>
  );
};

// Exemple 4: Page avec affichage des limitations
const DashboardPage = () => {
  const { currentPlan, usage, isLoading } = useSubscription();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1>Tableau de bord</h1>
      
      {/* Affichage des limitations du plan actuel */}
      <SubscriptionLimits showUpgrade={true} />
      
      {/* Actions principales avec vérifications */}
      <div className="flex gap-4">
        <CreateBienButton />
        <CreateEtatDesLieuxButton />
      </div>

      {/* Section photos pour un bien spécifique */}
      <PhotoUploadSection bienId="exemple-bien-id" />

      {/* Informations détaillées */}
      <div className="glass-card p-4">
        <h3>Informations du plan</h3>
        <p>Plan actuel: {currentPlan?.name}</p>
        <p>Prix: {currentPlan?.price === 0 ? 'Gratuit' : `${currentPlan?.price}€/mois`}</p>
        <p>Biens utilisés: {usage?.biens_count} / {currentPlan?.limitations.maxBiens}</p>
        <p>États des lieux ce mois: {usage?.etats_des_lieux_count_this_month} / {currentPlan?.limitations.maxEtatsDesLieux}</p>
      </div>
    </div>
  );
};

// Exemple 5: Hook personnalisé pour les vérifications communes
export const useSubscriptionChecks = () => {
  const { 
    canCreateBien, 
    canCreateEtatDesLieux, 
    canAddPhotos,
    currentPlan 
  } = useSubscription();

  const checkAndShowLimitMessage = (feature: 'bien' | 'etat' | 'photo', bienId?: string, count?: number) => {
    switch (feature) {
      case 'bien':
        if (!canCreateBien) {
          alert(`Limite de biens atteinte pour le plan ${currentPlan?.name}. Veuillez mettre à niveau votre plan.`);
          return false;
        }
        break;
      case 'etat':
        if (!canCreateEtatDesLieux) {
          alert(`Limite d'états des lieux mensuels atteinte pour le plan ${currentPlan?.name}.`);
          return false;
        }
        break;
      case 'photo':
        if (bienId && count && !canAddPhotos(bienId, count)) {
          alert(`Limite de photos par bien atteinte pour le plan ${currentPlan?.name}.`);
          return false;
        }
        break;
    }
    return true;
  };

  return { checkAndShowLimitMessage };
};

// Exemple d'utilisation dans un composant de classe (si nécessaire)
// import { SubscriptionContext } from '@/context/SubscriptionContext';
// 
// class MonComposantClasse extends React.Component {
//   static contextType = SubscriptionContext;
//   
//   handleAction = () => {
//     const { canCreateBien } = this.context;
//     if (!canCreateBien) {
//       // Afficher le message d'erreur
//       return;
//     }
//     // Continuer avec l'action
//   }
// }

export default DashboardPage;