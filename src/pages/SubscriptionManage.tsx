import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  Settings, 
  Download,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle
} from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { useStripeSubscription } from '@/hooks/useStripe';
import SubscriptionLimits from '@/components/SubscriptionLimits';
import { useNavigate } from 'react-router-dom';

const SubscriptionManage = () => {
  const { subscription, currentPlan, isLoading } = useSubscription();
  const { loading, handleManageSubscription } = useStripeSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="glass-card p-8 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'past_due':
        return <Badge variant="destructive">En retard</Badge>;
      case 'incomplete':
        return <Badge variant="secondary">Incomplet</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Gestion de l'abonnement
        </h1>
        <p className="text-slate-600">
          Gérez votre abonnement et consultez vos limites d'utilisation
        </p>
      </div>

      {/* Informations sur le plan actuel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Plan actuel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{currentPlan?.name}</h3>
              <p className="text-slate-600">
                {currentPlan?.price === 0 
                  ? 'Plan gratuit' 
                  : `${currentPlan?.price}€ par mois`
                }
              </p>
            </div>
            <div className="text-right">
              {subscription ? (
                <>
                  {getStatusBadge(subscription.status)}
                  <p className="text-sm text-slate-600 mt-1">
                    {subscription.status === 'active' && (
                      <>Renouvellement le {formatDate(subscription.current_period_end)}</>
                    )}
                  </p>
                </>
              ) : (
                <Badge variant="secondary">Plan gratuit</Badge>
              )}
            </div>
          </div>

          {subscription?.status === 'active' && currentPlan?.id !== 'free' && (
            <div className="flex gap-3">
              <Button 
                onClick={handleManageSubscription}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {loading ? 'Chargement...' : 'Gérer le paiement'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Changer de plan
              </Button>
            </div>
          )}

          {(!subscription || currentPlan?.id === 'free') && (
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2 btn-gradient"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Passer au premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Limitations et usage */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Utilisation et limites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionLimits showUpgrade={false} />
        </CardContent>
      </Card>

      {/* Historique de facturation */}
      {subscription && currentPlan?.id !== 'free' && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Facturation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="font-medium">Période actuelle</p>
                <p className="text-sm text-slate-600">
                  Du {formatDate(subscription.current_period_start)} au {formatDate(subscription.current_period_end)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{currentPlan.price}€</p>
                <Badge variant="outline">Payé</Badge>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Télécharger la facture
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations importantes */}
      <div className="space-y-4">
        {subscription?.status === 'past_due' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Votre dernier paiement a échoué. Veuillez mettre à jour vos informations de paiement 
              pour éviter l'interruption de votre service.
            </AlertDescription>
          </Alert>
        )}

        {subscription?.status === 'canceled' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Votre abonnement a été annulé et se terminera le {formatDate(subscription.current_period_end)}. 
              Vous pouvez le réactiver à tout moment.
            </AlertDescription>
          </Alert>
        )}

        {currentPlan?.id === 'free' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Vous utilisez actuellement le plan gratuit. Découvrez nos plans payants 
              pour débloquer plus de fonctionnalités et augmenter vos limites.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Support */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Besoin d'aide ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Notre équipe support est là pour vous aider selon votre plan :
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Plan Gratuit : Support communautaire</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Plan Essentiel : Support par email</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Plan Pro : Support prioritaire</span>
            </li>
          </ul>
          <div className="pt-4">
            <Button variant="outline" asChild>
              <a href="mailto:support@etat-des-lieux-manager.com">
                Contacter le support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManage;