import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier que la clé secrète Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY n\'est pas configurée');
      return res.status(500).json({ error: 'Configuration Stripe manquante' });
    }

    // Log des paramètres pour debug
    console.log('Paramètres de la session:', { priceId, userId, successUrl, cancelUrl });

    // Créer une session de checkout Stripe
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
    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Erreur détaillée lors de la création de la session de checkout:', error);
    
    // Retourner une erreur plus descriptive en mode développement
    const isDevelopment = process.env.NODE_ENV === 'development';
    return res.status(500).json({ 
      error: 'Internal server error',
      ...(isDevelopment && { details: error.message })
    });
  }
}