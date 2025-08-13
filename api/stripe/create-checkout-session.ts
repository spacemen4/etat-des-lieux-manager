import { VercelRequest, VercelResponse } from '@vercel/node';

// Import Stripe avec la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Erreur lors de la création de la session de checkout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}