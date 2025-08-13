import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';

export interface PlanLimitations {
  maxBiens: number;
  maxEtatsDesLieux: number; // par mois
  maxPhotosPerBien: number;
  supportLevel: 'community' | 'email' | 'priority';
  teamManagement?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  limitations: PlanLimitations;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  biens_count: number;
  etats_des_lieux_count_this_month: number;
  photos_count_per_bien: { [bien_id: string]: number };
}

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  currentPlan: SubscriptionPlan | null;
  usage: SubscriptionUsage | null;
  isLoading: boolean;
  canCreateBien: boolean;
  canCreateEtatDesLieux: boolean;
  canAddPhotos: (bienId: string, additionalPhotos: number) => boolean;
  getRemainingBiens: () => number;
  getRemainingEtatsDesLieux: () => number;
  getRemainingPhotos: (bienId: string) => number;
  upgradeSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Plans disponibles
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    limitations: {
      maxBiens: 1,
      maxEtatsDesLieux: 1,
      maxPhotosPerBien: 10,
      supportLevel: 'community'
    }
  },
  {
    id: 'essential',
    name: 'Essentiel',
    price: 9,
    limitations: {
      maxBiens: 5,
      maxEtatsDesLieux: 5,
      maxPhotosPerBien: 50,
      supportLevel: 'email'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    limitations: {
      maxBiens: 100,
      maxEtatsDesLieux: 50,
      maxPhotosPerBien: 200,
      supportLevel: 'priority',
      teamManagement: true
    }
  }
];

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userUuid } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentPlan = subscription 
    ? SUBSCRIPTION_PLANS.find(plan => plan.id === subscription.plan_id) || SUBSCRIPTION_PLANS[0]
    : SUBSCRIPTION_PLANS[0]; // Plan gratuit par défaut

  useEffect(() => {
    if (userUuid) {
      fetchSubscription();
      fetchUsage();
    }
  }, [userUuid]);

  const fetchSubscription = async () => {
    if (!userUuid) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userUuid)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors du chargement de l\'abonnement:', error);
      }

      setSubscription(data || null);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'abonnement:', error);
    }
  };

  const fetchUsage = async () => {
    if (!userUuid) return;
    
    try {
      // Compter les biens
      const { count: biensCount } = await supabase
        .from('etat_des_lieux')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userUuid);

      // Compter les états des lieux de ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: etatsDesLieuxCount } = await supabase
        .from('etat_des_lieux')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userUuid)
        .gte('created_at', startOfMonth.toISOString());

      // Pour les photos, on pourrait compter par bien si nécessaire
      // Pour l'instant, on initialise avec des valeurs par défaut
      const photosCountPerBien: { [bien_id: string]: number } = {};

      setUsage({
        biens_count: biensCount || 0,
        etats_des_lieux_count_this_month: etatsDesLieuxCount || 0,
        photos_count_per_bien: photosCountPerBien
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canCreateBien = () => {
    if (!usage || !currentPlan) return false;
    return usage.biens_count < currentPlan.limitations.maxBiens;
  };

  const canCreateEtatDesLieux = () => {
    if (!usage || !currentPlan) return false;
    return usage.etats_des_lieux_count_this_month < currentPlan.limitations.maxEtatsDesLieux;
  };

  const canAddPhotos = (bienId: string, additionalPhotos: number) => {
    if (!usage || !currentPlan) return false;
    const currentPhotos = usage.photos_count_per_bien[bienId] || 0;
    return (currentPhotos + additionalPhotos) <= currentPlan.limitations.maxPhotosPerBien;
  };

  const getRemainingBiens = () => {
    if (!usage || !currentPlan) return 0;
    return Math.max(0, currentPlan.limitations.maxBiens - usage.biens_count);
  };

  const getRemainingEtatsDesLieux = () => {
    if (!usage || !currentPlan) return 0;
    return Math.max(0, currentPlan.limitations.maxEtatsDesLieux - usage.etats_des_lieux_count_this_month);
  };

  const getRemainingPhotos = (bienId: string) => {
    if (!usage || !currentPlan) return 0;
    const currentPhotos = usage.photos_count_per_bien[bienId] || 0;
    return Math.max(0, currentPlan.limitations.maxPhotosPerBien - currentPhotos);
  };

  const upgradeSubscription = async (planId: string) => {
    if (!userUuid) throw new Error('Utilisateur non connecté');
    
    try {
      // TODO: Intégrer avec Stripe pour créer/modifier l'abonnement
      
      // Pour l'instant, on met à jour directement en base de données
      const newSubscription = {
        user_id: userUuid,
        plan_id: planId,
        status: 'active' as const,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
      };

      if (subscription) {
        // Mettre à jour l'abonnement existant
        const { error } = await supabase
          .from('user_subscriptions')
          .update(newSubscription)
          .eq('id', subscription.id);
          
        if (error) throw error;
      } else {
        // Créer un nouvel abonnement
        const { error } = await supabase
          .from('user_subscriptions')
          .insert([newSubscription]);
          
        if (error) throw error;
      }

      await refreshSubscription();
      toast.success('Abonnement mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      toast.error('Erreur lors de la mise à jour de l\'abonnement');
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;
    
    try {
      // TODO: Intégrer avec Stripe pour annuler l'abonnement
      
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscription.id);
        
      if (error) throw error;

      await refreshSubscription();
      toast.success('Abonnement annulé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      toast.error('Erreur lors de l\'annulation de l\'abonnement');
      throw error;
    }
  };

  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
    await fetchUsage();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        currentPlan,
        usage,
        isLoading,
        canCreateBien: canCreateBien(),
        canCreateEtatDesLieux: canCreateEtatDesLieux(),
        canAddPhotos,
        getRemainingBiens,
        getRemainingEtatsDesLieux,
        getRemainingPhotos,
        upgradeSubscription,
        cancelSubscription,
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};