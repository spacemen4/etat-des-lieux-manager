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
  ArrowUpCircle,
  Star,
  Users,
  FileText,
  Camera,
  Mail,
  MessageCircle,
  Zap
} from 'lucide-react';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/context/SubscriptionContext';
import { useStripeSubscription } from '@/hooks/useStripe';
import SubscriptionLimits from '@/components/SubscriptionLimits';
import { useNavigate } from 'react-router-dom';

const SubscriptionManage = () => {
  const { subscription, currentPlan, isLoading } = useSubscription();
  const { loading, handleSubscribeToPlan, handleManageSubscription } = useStripeSubscription();
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

  const getPlanFeatures = (planId: string) => {
    const features = {
      free: [
        { icon: Calendar, text: "1 état des lieux/mois" },
        { icon: Camera, text: "Photos illimitées" },
        { icon: FileText, text: "Rapport PDF simple" },
        { icon: MessageCircle, text: "Support communautaire" }
      ],
      essential: [
        { icon: Calendar, text: "10 états des lieux/mois" },
        { icon: Camera, text: "Photos illimitées" },
        { icon: FileText, text: "Rapports PDF avancés" },
        { icon: Mail, text: "Support email" }
      ],
      pro: [
        { icon: Calendar, text: "États des lieux illimités" },
        { icon: Camera, text: "Photos illimitées" },
        { icon: Users, text: "Gestion équipe" },
        { icon: FileText, text: "Rapports PDF avancés" },
        { icon: FileText, text: "Export données" },
        { icon: Zap, text: "Support prioritaire" }
      ]
    };
    return features[planId as keyof typeof features] || [];
  };

  const getPlanDescription = (planId: string) => {
    const descriptions = {
      free: "Pour découvrir notre solution.",
      essential: "Pour les propriétaires et les petites structures.",
      pro: "Pour les agents et gestionnaires immobiliers."
    };
    return descriptions[planId as keyof typeof descriptions] || "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-6">
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

      {/* Plans d'abonnement */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Choisissez votre plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const features = getPlanFeatures(plan.id);
            const isPopular = plan.id === 'pro';
            
            return (
              <Card key={plan.id} className={`relative glass-card card-hover-subtle ${
                isCurrentPlan 
                  ? 'ring-2 ring-blue-500 shadow-md' 
                  : isPopular
                    ? 'border-2 border-orange-500 shadow-md'
                    : ''
              }`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1">
                      Le plus populaire
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Plan actuel
                    </Badge>
                  </div>
                )}

                <CardHeader className={`text-center ${isPopular ? 'pb-4' : ''}`}>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-slate-600 text-sm mt-1">
                    {getPlanDescription(plan.id)}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.price}€
                    </span>
                    <span className="text-slate-600">/mois</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {features.map((feature, index) => {
                      const IconComponent = feature.icon;
                      return (
                        <li key={index} className="flex items-center gap-3">
                          <IconComponent className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-sm text-slate-700">{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button disabled className="w-full" variant="outline">
                        <Crown className="w-4 h-4 mr-2" />
                        Plan actuel
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full micro-lift ${
                          isPopular 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white' 
                            : plan.id === 'free' 
                              ? 'bg-slate-600 hover:bg-slate-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        onClick={() => handleSubscribeToPlan(plan.id)}
                        disabled={loading}
                      >
                        {loading ? 'Chargement...' : 'Choisir ce plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

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