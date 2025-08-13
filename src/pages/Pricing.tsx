import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Building, Camera, FileText, Mail, MessageSquare, Zap } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useStripeSubscription } from '@/hooks/useStripe';

const Pricing = () => {
  const { userUuid } = useUser();
  const { currentPlan, subscription } = useSubscription();
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
        '1 bien',
        '1 état des lieux/an',
        'Jusqu\'à 10 photos/bien',
        'Rapport PDF simple',
        'Support communautaire'
      ],
      limitations: {
        maxBiens: 1,
        maxEtatsDesLieux: 1,
        maxPhotosPerBien: 10,
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
        'Jusqu\'à 5 biens',
        '5 états des lieux/mois',
        'Jusqu\'à 50 photos/bien',
        'Rapports PDF',
        'Support email'
      ],
      limitations: {
        maxBiens: 5,
        maxEtatsDesLieux: 5,
        maxPhotosPerBien: 50,
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
        'Jusqu\'à 100 biens',
        'Gestion équipe',
        '50 états des lieux/mois',
        'Jusqu\'à 200 photos/bien',
        'Rapports PDF',
        'Support prioritaire'
      ],
      limitations: {
        maxBiens: 100,
        maxEtatsDesLieux: 50,
        maxPhotosPerBien: 200,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-6">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-slate-600/80 max-w-3xl mx-auto leading-relaxed">
            Démarrez gratuitement et évoluez selon vos besoins. 
            Tous nos plans incluent l'accès à notre plateforme complète de gestion d'états des lieux.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-slate-600">
              30 jours de garantie satisfait ou remboursé
            </span>
          </div>
        </div>

        {/* Plans de tarification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-16 mt-12 px-4">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const currentPlan = isCurrentPlan(plan.id);
            return (
              <div key={plan.id} className="relative">
                {/* Badge en haut avec plus d'espace */}
                {(plan.popular || currentPlan) && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge 
                      className={`px-4 py-2 text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap ${
                        currentPlan 
                          ? 'bg-green-500 hover:bg-green-600 text-white border-green-400' 
                          : 'gradient-primary text-white border-blue-400'
                      }`}
                    >
                      {currentPlan ? 'Plan actuel' : 'Le plus populaire'}
                    </Badge>
                  </div>
                )}
                
                <Card 
                  className={`relative glass-card backdrop-blur-xl border-2 transition-all duration-300 hover:scale-105 animate-slide-up mt-4 ${
                    plan.popular 
                      ? 'border-blue-400/50 ring-2 ring-blue-400/20 shadow-2xl' 
                      : currentPlan
                      ? 'border-green-400/50 ring-2 ring-green-400/20 shadow-xl'
                      : 'border-white/20 hover:border-blue-300/30'
                  }`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                
                <CardHeader className="text-center pb-8 pt-10">
                  <div className="mb-4 flex justify-center">
                    <div className={`p-3 rounded-2xl ${
                      plan.popular 
                        ? 'gradient-primary' 
                        : currentPlan 
                        ? 'bg-green-100 border-2 border-green-200' 
                        : 'glass'
                    }`}>
                      <IconComponent className={`h-8 w-8 ${
                        plan.popular 
                          ? 'text-white' 
                          : currentPlan 
                          ? 'text-green-600' 
                          : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  
                  <p className="text-slate-600/80 text-sm mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold gradient-text">
                        {plan.price}€
                      </span>
                      <span className="text-slate-600/80 text-lg">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                        <span className="text-slate-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-6">
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      variant={isCurrentPlan(plan.id) ? 'secondary' : plan.buttonVariant}
                      size="lg"
                      className={`w-full transition-all duration-300 ${
                        plan.popular 
                          ? 'btn-gradient shadow-lg hover:shadow-xl' 
                          : 'hover:scale-105'
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

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold gradient-text mb-8">
            Questions fréquentes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="glass-light text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Puis-je changer de plan à tout moment ?
                </h3>
                <p className="text-slate-600/80 text-sm">
                  Oui, vous pouvez modifier votre plan à tout moment. 
                  Les changements prennent effet immédiatement.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-light text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Y a-t-il des frais cachés ?
                </h3>
                <p className="text-slate-600/80 text-sm">
                  Non, tous nos prix sont transparents. 
                  Aucun frais d'installation ou frais cachés.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-light text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Que se passe-t-il si je dépasse mes limites ?
                </h3>
                <p className="text-slate-600/80 text-sm">
                  Nous vous notifierons avant d'atteindre vos limites 
                  et vous proposerons de passer au plan supérieur.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-light text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Le support est-il inclus ?
                </h3>
                <p className="text-slate-600/80 text-sm">
                  Oui, chaque plan inclut un niveau de support adapté. 
                  Du support communautaire au support prioritaire.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold gradient-text mb-4">
              Besoin d'un plan personnalisé ?
            </h3>
            <p className="text-slate-600/80 mb-6">
              Pour les grandes entreprises ou besoins spécifiques, 
              contactez-nous pour un devis sur mesure.
            </p>
            <Button asChild className="btn-gradient">
              <a href="mailto:contact@etat-des-lieux-manager.com">
                <Mail className="h-4 w-4 mr-2" />
                Nous contacter
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;