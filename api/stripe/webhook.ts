import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialiser Supabase pour les opérations côté serveur
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service role pour les opérations côté serveur
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('Webhook secret not configured');
    }
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Gérer les événements
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💰 Checkout session completed:', session.id);

  const userId = session.client_reference_id || session.metadata?.userId;
  
  if (!userId) {
    console.error('❌ User ID not found in checkout session');
    return;
  }

  // Récupérer les détails de la subscription
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const customer = await stripe.customers.retrieve(session.customer as string);

  // Déterminer le plan basé sur le price ID
  const priceId = subscription.items.data[0].price.id;
  let planId = 'free';
  
  if (priceId === process.env.VITE_STRIPE_PRICE_ESSENTIAL) {
    planId = 'essential';
  } else if (priceId === process.env.VITE_STRIPE_PRICE_PRO) {
    planId = 'pro';
  }

  // Créer ou mettre à jour l'abonnement en base
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof customer === 'string' ? customer : customer.id,
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'abonnement:', error);
  } else {
    console.log('✅ Abonnement sauvegardé avec succès');
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  // Trouver l'utilisateur via l'abonnement Stripe
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!userSub) {
    console.error('❌ Utilisateur non trouvé pour l\'abonnement:', subscription.id);
    return;
  }

  // Mettre à jour le statut de l'abonnement
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'abonnement:', error);
  } else {
    console.log('✅ Abonnement mis à jour avec succès');
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);

  // Marquer l'abonnement comme annulé
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Erreur lors de l\'annulation de l\'abonnement:', error);
  } else {
    console.log('✅ Abonnement annulé avec succès');
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💳 Invoice payment succeeded:', invoice.id);
  // Ici vous pourriez ajouter de la logique supplémentaire
  // comme l'envoi d'un email de confirmation
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
  
  // Vous pourriez marquer l'abonnement comme en retard de paiement
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', invoice.subscription as string);

  if (error) {
    console.error('❌ Erreur lors de la mise à jour du statut de paiement:', error);
  }
}