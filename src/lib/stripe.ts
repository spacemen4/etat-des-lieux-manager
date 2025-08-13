import { loadStripe } from '@stripe/stripe-js';

// Clés publiques Stripe (à configurer dans les variables d'environnement)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';

// Initialiser Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Configuration des prix Stripe (à configurer selon vos prix réels)
export const STRIPE_PRICE_IDS = {
  essential: import.meta.env.VITE_STRIPE_PRICE_ESSENTIAL || 'price_essential_monthly',
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO || 'price_pro_monthly'
};

// URLs de redirection
export const STRIPE_URLS = {
  success: `${window.location.origin}/subscription/success`,
  cancel: `${window.location.origin}/subscription/cancel`
};

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Fonction pour créer une session de checkout Stripe
export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: params.priceId,
      userId: params.userId,
      successUrl: params.successUrl || STRIPE_URLS.success,
      cancelUrl: params.cancelUrl || STRIPE_URLS.cancel,
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création de la session de paiement');
  }

  return response.json();
};

// Fonction pour créer un portail de gestion d'abonnement
export const createCustomerPortalSession = async (customerId: string) => {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: `${window.location.origin}/subscription/manage`
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création de la session du portail client');
  }

  return response.json();
};