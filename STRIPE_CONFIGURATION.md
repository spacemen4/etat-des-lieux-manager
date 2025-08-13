# Configuration Stripe

## Variables d'environnement

Copiez `.env.example` vers `.env` et remplissez avec vos vraies valeurs :

```bash
cp .env.example .env
```

## Clés Stripe de test

Pour le développement, utilisez vos clés de test Stripe :

- `VITE_STRIPE_PUBLISHABLE_KEY` : Votre clé publique Stripe (commence par `pk_test_`)
- `STRIPE_SECRET_KEY` : Votre clé secrète Stripe (commence par `sk_test_`)

## Configuration des produits

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com/test/products)
2. Créez des produits avec des prix récurrents
3. Copiez les Price IDs dans vos variables d'environnement :
   - `VITE_STRIPE_PRICE_ESSENTIAL` : ID du prix pour le plan Essentiel  
   - `VITE_STRIPE_PRICE_PRO` : ID du prix pour le plan Pro

## Webhooks

1. Dans votre Dashboard Stripe, allez dans "Webhooks"
2. Créez un nouveau webhook endpoint : `https://votre-domaine.com/api/stripe/webhook`
3. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copiez le "Signing secret" dans `STRIPE_WEBHOOK_SECRET`

## Sécurité

⚠️ **Important** : Ne jamais committer le fichier `.env` avec de vraies clés API !

Le fichier `.env` est dans `.gitignore` pour éviter les fuites de sécurité.