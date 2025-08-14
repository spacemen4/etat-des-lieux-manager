import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Building, Mail, Zap } from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { useStripeSubscription } from '@/hooks/useStripe';

const Pricing = () => {
  const { currentPlan } = useSubscription();
  const { loading, handleSubscribeToPlan } = useStripeSubscription();

  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Pour découvrir notre solution.',
      price: 0,
      period: '/mois',
      popular: false,
      features: [
        '1 état des lieux/mois',
        'Photos illimitées',
        'Rapport PDF simple',
        'Support communautaire'
      ],
      limitations: {
        maxEtatsDesLieux: 1,
        supportLevel: 'community'
      },
      icon: Building,
      buttonText: 'Commencer gratuitement',
      buttonVariant: 'outline' as const
    },
    {
      id: 'essential',
      name: 'Essentiel',
      description: 'Pour les propriétaires et les petites structures.',
      price: 9,
      period: '/mois',
      popular: false,
      features: [
        '10 états des lieux/mois',
        'Photos illimitées',
        'Rapports PDF avancés',
        'Support email'
      ],
      limitations: {
        maxEtatsDesLieux: 10,
        supportLevel: 'email'
      },
      icon: Users,
      buttonText: 'Choisir ce plan',
      buttonVariant: 'outline' as const
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Pour les agents et gestionnaires immobiliers.',
      price: 29,
      period: '/mois',
      popular: true,
      features: [
        'États des lieux illimités',
        'Photos illimitées',
        'Gestion équipe',
        'Rapports PDF avancés',
        'Export données',
        'Support prioritaire'
      ],
      limitations: {
        maxEtatsDesLieux: -1, // -1 = illimité
        supportLevel: 'priority',
        teamManagement: true
      },
      icon: Star,
      buttonText: 'Choisir ce plan',
      buttonVariant: 'default' as const
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    await handleSubscribeToPlan(planId);
  };

  const isCurrentPlan = (planId: string) => {
    return currentPlan?.id === planId;
  };

  return (
    <div className="space-y-8 animate-fade-in custom-scrollbar">
      <div className="flex flex-col justify-between items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1">
            Choisissez votre plan
          </h2>
          <p className="text-slate-600/80 text-sm">
            Démarrez gratuitement et évoluez selon vos besoins d'états des lieux
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-xs text-slate-600/80">
            30 jours de garantie satisfait ou remboursé
          </span>
        </div>
      </div>

        {/* Plans de tarification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const currentPlan = isCurrentPlan(plan.id);
            return (
              <div key={plan.id} className="relative">
                {/* Badge en haut avec plus d'espace */}
                {(plan.popular || currentPlan) && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge 
                      className={`px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                        currentPlan 
                          ? 'bg-green-500 text-white' 
                          : 'gradient-primary text-white'
                      }`}
                    >
                      {currentPlan ? 'Plan actuel' : 'Le plus populaire'}
                    </Badge>
                  </div>
                )}
                
                <Card 
                  className={`glass-heavy hover:shadow-lg transition-shadow mt-4 ${
                    plan.popular 
                      ? 'ring-2 ring-blue-400/30' 
                      : currentPlan
                      ? 'ring-2 ring-green-400/30'
                      : ''
                  }`}
                >
                
                <CardHeader className="text-center pb-4 pt-6">
                  <div className="mb-3 flex justify-center">
                    <div className={`p-2 rounded-lg ${
                      plan.popular 
                        ? 'bg-gradient-primary' 
                        : currentPlan 
                        ? 'bg-green-100' 
                        : 'bg-gradient-cool'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        plan.popular 
                          ? 'text-white' 
                          : currentPlan 
                          ? 'text-green-600' 
                          : 'text-white'
                      }`} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-xl font-bold gradient-text mb-1">
                    {plan.name}
                  </CardTitle>
                  
                  <p className="text-slate-600/80 text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold gradient-text">
                        {plan.price}€
                      </span>
                      <span className="text-slate-600/80 text-sm">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-1">
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-slate-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      variant={isCurrentPlan(plan.id) ? 'secondary' : plan.buttonVariant}
                      className={`w-full transition-all duration-300 ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : ''
                      }`}
                      disabled={loading || isCurrentPlan(plan.id)}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Chargement...
                        </div>
                      ) : isCurrentPlan(plan.id) ? (
                        'Plan actuel'
                      ) : (
                        plan.buttonText
                      )}
                    </Button>
                  </div>
                </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Section contact simple */}
        <Card className="glass-heavy">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold gradient-text mb-2">
              Besoin d'aide ?
            </h3>
            <p className="text-slate-600/80 text-sm mb-4">
              Notre équipe est là pour répondre à vos questions
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:contact@etat-des-lieux-manager.com" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Nous contacter
              </a>
            </Button>
          </CardContent>
        </Card>
    </div>
  );
};

export default Pricing;