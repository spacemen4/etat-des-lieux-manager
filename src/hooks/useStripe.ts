import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise, createCheckoutSession, createCustomerPortalSession, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { useSubscription } from '@/context/SubscriptionContext';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';

export const useStripeSubscription = () => {
  const [loading, setLoading] = useState(false);
  const { userUuid } = useUser();
  const { subscription, upgradeSubscription } = useSubscription();

  const handleSubscribeToPlan = async (planId: string) => {
    console.log('🚀 handleSubscribeToPlan appelé avec planId:', planId);
    console.log('🔑 userUuid:', userUuid);
    
    if (!userUuid) {
      console.error('❌ Pas d\'utilisateur connecté');
      toast.error('Vous devez être connecté pour vous abonner');
      return;
    }

    if (planId === 'free') {
      console.log('📋 Activation du plan gratuit');
      try {
        await upgradeSubscription('free');
        toast.success('Plan gratuit activé !');
        return;
      } catch (error) {
        console.error('❌ Erreur lors de l\'activation du plan gratuit:', error);
        toast.error('Erreur lors de l\'activation du plan gratuit');
        return;
      }
    }

    setLoading(true);
    
    try {
      console.log('💳 Initialisation de Stripe...');
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe n\'est pas disponible');
      }
      console.log('✅ Stripe initialisé');

      // Obtenir l'ID de prix Stripe correspondant
      const priceId = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS];
      console.log('💰 Price ID récupéré:', priceId);
      console.log('📊 STRIPE_PRICE_IDS disponibles:', STRIPE_PRICE_IDS);
      
      if (!priceId) {
        console.error('❌ Plan non trouvé pour:', planId);
        throw new Error('Plan non trouvé');
      }

      console.log('🔄 Création de la session de checkout...');
      console.log('📤 Paramètres envoyés:', { priceId, userId: userUuid });
      
      // Créer une session de checkout
      const { sessionId } = await createCheckoutSession({
        priceId,
        userId: userUuid
      });

      console.log('✅ Session créée avec ID:', sessionId);

      // Rediriger vers Stripe Checkout
      console.log('🔄 Redirection vers Stripe Checkout...');
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        console.error('❌ Erreur lors de la redirection:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Erreur détaillée lors de la création de la session de paiement:', error);
      console.error('📊 Type d\'erreur:', typeof error);
      console.error('📊 Message d\'erreur:', error instanceof Error ? error.message : 'Erreur inconnue');
      toast.error('Erreur lors du processus de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) {
      toast.error('Aucun abonnement actif trouvé');
      return;
    }

    setLoading(true);

    try {
      const { url } = await createCustomerPortalSession(subscription.stripe_customer_id);
      window.location.href = url;
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du portail client:', error);
      toast.error('Erreur lors de l\'ouverture du portail de gestion');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubscribeToPlan,
    handleManageSubscription
  };
};

// Hook pour les composants de paiement direct avec Stripe Elements
export const useStripePayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async (paymentMethodId: string) => {
    if (!stripe || !elements) {
      setError('Stripe n\'est pas prêt');
      return { success: false };
    }

    setProcessing(true);
    setError(null);

    try {
      // Ici vous pouvez ajouter la logique de traitement du paiement
      // par exemple, créer un PaymentIntent côté serveur et le confirmer

      const { error: confirmError } = await stripe.confirmCardPayment(
        // clientSecret obtenu depuis votre serveur
        'pi_...',
        {
          payment_method: paymentMethodId
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Erreur de paiement');
        return { success: false };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return { success: false };
    } finally {
      setProcessing(false);
    }
  };

  const createPaymentMethod = async (cardElement: any) => {
    if (!stripe || !cardElement) {
      setError('Stripe n\'est pas prêt');
      return null;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message || 'Erreur lors de la création du mode de paiement');
      return null;
    }

    return paymentMethod;
  };

  return {
    stripe,
    elements,
    processing,
    error,
    processPayment,
    createPaymentMethod,
    setError
  };
};