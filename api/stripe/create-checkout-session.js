import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DEBUT CREATE CHECKOUT SESSION ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    if (!priceId || !userId) {
      console.error('Champs manquants:', { priceId: !!priceId, userId: !!userId });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier que la clé secrète Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY n\'est pas configurée');
      return res.status(500).json({ error: 'Configuration Stripe manquante' });
    }

    console.log('STRIPE_SECRET_KEY existe:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_SECRET_KEY commence par:', process.env.STRIPE_SECRET_KEY?.substring(0, 10));

    // Log des paramètres pour debug
    console.log('Paramètres de la session:', { priceId, userId, successUrl, cancelUrl });

    // Créer une session de checkout Stripe
    console.log('Tentative de création de session Stripe...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.VITE_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.VITE_APP_URL}/abonnement`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    });

    console.log('Session créée avec succès:', session.id);
    console.log('=== FIN CREATE CHECKOUT SESSION ===');
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('=== ERREUR CREATE CHECKOUT SESSION ===');
    console.error('Type d\'erreur:', typeof error);
    console.error('Erreur complète:', error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    
    if (error?.type === 'StripeError') {
      console.error('Code Stripe:', error.code);
      console.error('Paramètre:', error.param);
    }
    
    // Retourner une erreur détaillée
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error',
      type: error?.type || 'unknown',
      code: error?.code || 'unknown'
    });
  }
}