# Configuration du système de paiement avec Stripe

Ce guide explique comment configurer le système d'abonnement avec Stripe pour l'application État des Lieux Manager.

## 📋 Table des matières

1. [Configuration Stripe](#configuration-stripe)
2. [Configuration de la base de données](#configuration-de-la-base-de-données)
3. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
4. [Intégration dans l'application](#intégration-dans-lapplication)
5. [Tests](#tests)
6. [Déploiement](#déploiement)

## 🔧 Configuration Stripe

### 1. Créer un compte Stripe

1. Allez sur [https://stripe.com](https://stripe.com) et créez un compte
2. Activez votre compte en mode test pour commencer

### 2. Créer les produits et prix

Dans le dashboard Stripe :

1. **Créer les produits :**
   - Allez dans `Produits` > `Ajouter un produit`
   - Créez un produit pour chaque plan :
     - "État des Lieux Manager - Essentiel"
     - "État des Lieux Manager - Pro"

2. **Configurer les prix :**
   - Plan Essentiel : 9€/mois récurrent
   - Plan Pro : 29€/mois récurrent

3. **Récupérer les Price IDs :**
   - Notez les IDs des prix (commencent par `price_...`)
   - Vous en aurez besoin pour les variables d'environnement

### 3. Configurer les webhooks (pour le backend)

1. Allez dans `Développeurs` > `Webhooks`
2. Créez un endpoint : `https://votre-domaine.com/api/stripe/webhook`
3. Sélectionnez ces événements :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🗄️ Configuration de la base de données

### 1. Exécuter les migrations

Exécutez le fichier SQL `sql/subscription_tables.sql` dans votre base de données Supabase :

```sql
-- Le fichier crée automatiquement :
-- - Table user_subscriptions
-- - Table payment_history
-- - Table usage_tracking
-- - Fonctions utilitaires
-- - Politiques RLS
```

### 2. Vérifier les permissions

Assurez-vous que les politiques RLS sont activées et que les utilisateurs ne peuvent accéder qu'à leurs propres données.

## ⚙️ Configuration des variables d'environnement

Copiez `.env.example` vers `.env` et remplissez :

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
VITE_STRIPE_PRICE_ESSENTIAL=price_votre_id_essentiel
VITE_STRIPE_PRICE_PRO=price_votre_id_pro

# URLs
VITE_APP_URL=http://localhost:5173
```

## 🔗 Intégration dans l'application

### 1. Wrapper l'application avec les providers

Dans votre `main.tsx` ou `App.tsx` :

```tsx
import { SubscriptionProvider } from '@/context/SubscriptionContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserProvider>
          <SubscriptionProvider>
            {/* Votre application */}
          </SubscriptionProvider>
        </UserProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### 2. Utiliser le contexte de subscription

```tsx
import { useSubscription } from '@/context/SubscriptionContext';

function MonComposant() {
  const { 
    currentPlan, 
    canCreateBien, 
    canCreateEtatDesLieux,
    getRemainingBiens 
  } = useSubscription();

  // Vérifier les limitations avant d'autoriser des actions
  if (!canCreateBien()) {
    return <div>Limite de biens atteinte. Mettez à niveau votre plan.</div>;
  }
}
```

### 3. Ajouter les routes

Dans votre routeur :

```tsx
import Pricing from '@/pages/Pricing';
import SubscriptionManage from '@/pages/SubscriptionManage';

// Routes
{
  path: '/pricing',
  element: <Pricing />
},
{
  path: '/subscription/manage',
  element: <SubscriptionManage />
}
```

## 🎯 Plans disponibles

### Plan Gratuit (0€/mois)
- 1 bien
- 1 état des lieux/an
- Jusqu'à 10 photos/bien
- Rapport PDF simple
- Support communautaire

### Plan Essentiel (9€/mois)
- Jusqu'à 5 biens
- 5 états des lieux/mois
- Jusqu'à 50 photos/bien
- Rapports PDF
- Support email

### Plan Pro (29€/mois)
- Jusqu'à 100 biens
- Gestion équipe
- 50 états des lieux/mois
- Jusqu'à 200 photos/bien
- Rapports PDF
- Support prioritaire

## 🧪 Tests

### Test en mode développement

1. Utilisez les clés de test Stripe (commencent par `pk_test_` et `sk_test_`)
2. Utilisez les numéros de carte de test :
   - Succès : `4242 4242 4242 4242`
   - Échec : `4000 0000 0000 0002`
   - Authentification requise : `4000 0000 0000 3220`

### Test des limitations

1. Créez un utilisateur avec le plan gratuit
2. Vérifiez qu'il ne peut créer qu'1 bien
3. Passez au plan essentiel et vérifiez les nouvelles limites

## 🚀 Déploiement

### 1. Backend API Routes (nécessaire pour Stripe)

Vous devrez créer des routes API backend pour :
- Créer des sessions de checkout
- Gérer les webhooks Stripe
- Créer des sessions du portail client

Exemple avec Next.js API Routes ou Express :

```typescript
// /api/stripe/create-checkout-session
export async function POST(request: Request) {
  const { priceId, userId } = await request.json();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/subscription/success`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId }
  });
  
  return Response.json({ sessionId: session.id });
}
```

### 2. Variables d'environnement de production

```bash
# Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Sécurité

- ✅ Utilisez HTTPS en production
- ✅ Validez les webhooks avec la signature
- ✅ Vérifiez les permissions côté serveur
- ✅ Ne jamais exposer les clés secrètes côté client

## 🔧 Maintenance

### Monitoring

- Surveillez les échecs de paiement dans Stripe Dashboard
- Vérifiez les logs des webhooks
- Monitoring des métriques d'abonnement

### Support client

- Les utilisateurs peuvent gérer leur abonnement via `/subscription/manage`
- Le portail client Stripe permet de :
  - Mettre à jour les informations de paiement
  - Télécharger les factures
  - Annuler l'abonnement

## 📞 Support

En cas de problème :
1. Vérifiez les logs Stripe Dashboard
2. Consultez la documentation Stripe
3. Vérifiez les permissions Supabase
4. Testez avec les cartes de test Stripe

## 🎉 C'est tout !

Votre système d'abonnement avec Stripe est maintenant configuré et prêt à être utilisé !