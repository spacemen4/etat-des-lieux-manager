import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  FileText, 
  Camera, 
  AlertTriangle, 
  Crown, 
  ArrowUpCircle 
} from 'lucide-react';
import { useSubscription } from '@/context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface SubscriptionLimitsProps {
  showUpgrade?: boolean;
  className?: string;
}

const SubscriptionLimits: React.FC<SubscriptionLimitsProps> = ({ 
  showUpgrade = true, 
  className = '' 
}) => {
  const { 
    currentPlan, 
    usage, 
    getRemainingBiens, 
    getRemainingEtatsDesLieux,
    canCreateBien,
    canCreateEtatDesLieux
  } = useSubscription();
  
  const navigate = useNavigate();

  if (!currentPlan || !usage) {
    return null;
  }

  const biensUsage = usage.biens_count;
  const biensLimit = currentPlan.limitations.maxBiens;
  const biensPercentage = (biensUsage / biensLimit) * 100;

  const etatsUsage = usage.etats_des_lieux_count_this_month;
  const etatsLimit = currentPlan.limitations.maxEtatsDesLieux;
  const etatsPercentage = (etatsUsage / etatsLimit) * 100;

  const isNearLimit = biensPercentage > 80 || etatsPercentage > 80;
  const isAtLimit = !canCreateBien || !canCreateEtatDesLieux;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Alerte si proche des limites */}
      {isAtLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous avez atteint les limites de votre plan {currentPlan.name}. 
            {showUpgrade && (
              <Button 
                variant="link" 
                className="p-0 h-auto text-destructive underline ml-1"
                onClick={() => navigate('/pricing')}
              >
                Mettre à niveau
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isAtLimit && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vous approchez des limites de votre plan {currentPlan.name}.
          </AlertDescription>
        </Alert>
      )}

      {/* Informations du plan actuel */}
      <div className="glass-light p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Plan {currentPlan.name}</span>
            <Badge variant={currentPlan.id === 'free' ? 'secondary' : 'default'}>
              {currentPlan.price === 0 ? 'Gratuit' : `${currentPlan.price}€/mois`}
            </Badge>
          </div>
          {showUpgrade && currentPlan.id !== 'pro' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-1"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Upgrader
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Limitation des biens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-500" />
                <span>Biens</span>
              </div>
              <span className="font-medium">
                {biensUsage} / {biensLimit === 999 ? '∞' : biensLimit}
              </span>
            </div>
            <Progress 
              value={biensLimit === 999 ? 0 : biensPercentage} 
              className="h-2"
            />
            <div className="text-xs text-slate-600">
              {getRemainingBiens()} bien{getRemainingBiens() > 1 ? 's' : ''} restant{getRemainingBiens() > 1 ? 's' : ''}
            </div>
          </div>

          {/* Limitation des états des lieux */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>États des lieux ce mois</span>
              </div>
              <span className="font-medium">
                {etatsUsage} / {etatsLimit === 999 ? '∞' : etatsLimit}
              </span>
            </div>
            <Progress 
              value={etatsLimit === 999 ? 0 : etatsPercentage} 
              className="h-2"
            />
            <div className="text-xs text-slate-600">
              {getRemainingEtatsDesLieux()} état{getRemainingEtatsDesLieux() > 1 ? 's' : ''} des lieux restant{getRemainingEtatsDesLieux() > 1 ? 's' : ''}
            </div>
          </div>

          {/* Limitation des photos */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-500" />
              <span>Photos par bien</span>
            </div>
            <span className="font-medium">
              Jusqu'à {currentPlan.limitations.maxPhotosPerBien === 999 ? '∞' : currentPlan.limitations.maxPhotosPerBien}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLimits;