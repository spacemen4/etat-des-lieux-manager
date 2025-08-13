import React, { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Crown, 
  ArrowUpCircle, 
  Lock,
  Building,
  FileText,
  Camera
} from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: 'createBien' | 'createEtatDesLieux' | 'addPhotos';
  bienId?: string;
  photosToAdd?: number;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  bienId,
  photosToAdd = 1,
  fallback,
  showUpgradeButton = true
}) => {
  const { 
    currentPlan, 
    canCreateBien, 
    canCreateEtatDesLieux,
    canAddPhotos,
    getRemainingBiens,
    getRemainingEtatsDesLieux,
    getRemainingPhotos
  } = useSubscription();
  
  const navigate = useNavigate();

  const getFeatureInfo = () => {
    switch (feature) {
      case 'createBien':
        return {
          canUse: canCreateBien,
          remaining: getRemainingBiens(),
          icon: Building,
          featureName: 'bien',
          limit: currentPlan?.limitations.maxBiens || 1
        };
      case 'createEtatDesLieux':
        return {
          canUse: canCreateEtatDesLieux,
          remaining: getRemainingEtatsDesLieux(),
          icon: FileText,
          featureName: 'état des lieux',
          limit: currentPlan?.limitations.maxEtatsDesLieux || 1
        };
      case 'addPhotos':
        return {
          canUse: bienId ? canAddPhotos(bienId, photosToAdd) : false,
          remaining: bienId ? getRemainingPhotos(bienId) : 0,
          icon: Camera,
          featureName: 'photo',
          limit: currentPlan?.limitations.maxPhotosPerBien || 10
        };
      default:
        return {
          canUse: false,
          remaining: 0,
          icon: Lock,
          featureName: 'fonctionnalité',
          limit: 0
        };
    }
  };

  const featureInfo = getFeatureInfo();
  const IconComponent = featureInfo.icon;

  // Si l'utilisateur peut utiliser la fonctionnalité, afficher le contenu
  if (featureInfo.canUse) {
    return <>{children}</>;
  }

  // Si un fallback personnalisé est fourni, l'utiliser
  if (fallback) {
    return <>{fallback}</>;
  }

  // Sinon, afficher le message de limitation par défaut
  return (
    <Alert variant="destructive" className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-orange-500" />
            <span className="font-medium">
              Limite atteinte
            </span>
            <Badge variant="secondary" className="text-xs">
              Plan {currentPlan?.name}
            </Badge>
          </div>
          <Crown className="h-4 w-4 text-yellow-500" />
        </div>
        
        <div className="text-sm text-slate-700">
          {feature === 'createBien' && (
            <>
              Vous avez atteint la limite de {featureInfo.limit} bien{featureInfo.limit > 1 ? 's' : ''} 
              de votre plan {currentPlan?.name}.
            </>
          )}
          {feature === 'createEtatDesLieux' && (
            <>
              Vous avez atteint la limite de {featureInfo.limit} état{featureInfo.limit > 1 ? 's' : ''} des lieux 
              par mois de votre plan {currentPlan?.name}.
            </>
          )}
          {feature === 'addPhotos' && (
            <>
              Vous avez atteint la limite de {featureInfo.limit} photo{featureInfo.limit > 1 ? 's' : ''} 
              par bien de votre plan {currentPlan?.name}.
            </>
          )}
        </div>

        {showUpgradeButton && currentPlan?.id !== 'pro' && (
          <Button 
            variant="default"
            size="sm"
            onClick={() => navigate('/pricing')}
            className="btn-gradient flex items-center gap-2 mt-3"
          >
            <ArrowUpCircle className="h-4 w-4" />
            Mettre à niveau mon plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default SubscriptionGuard;