import { VercelRequest, VercelResponse } from '@vercel/node';

// Import Stripe avec la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Créer une session du portail client Stripe
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.VITE_APP_URL}/abonnement`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session du portail client:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}