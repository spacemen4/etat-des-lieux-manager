import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

interface FormProgressProps {
  steps: Step[];
}

// Version simplifiée ultra-compacte pour smartphone
const SimplifiedMobileProgress: React.FC<FormProgressProps> = ({ steps }) => {
  const currentStepIndex = steps.findIndex(step => step.current);
  const completedSteps = steps.filter(step => step.completed).length;
  const currentStep = steps[currentStepIndex];
  const progressPercentage = ((completedSteps + (currentStep ? 0.5 : 0)) / steps.length) * 100;
  
  return (
    <nav aria-label="Progress" className="w-full progress-mobile sm:hidden animate-fade-in">
      {/* Barre compacte avec étape courante et progression */}
      <div className="glass-light rounded-xl p-3 backdrop-blur-xl border border-white/20">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
              currentStep?.completed 
                ? 'gradient-cool text-white shadow-lg' 
                : 'gradient-primary text-white shadow-lg'
            }`}>
              {currentStep?.completed ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{currentStepIndex + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold gradient-text truncate">
                {currentStep ? currentStep.title : 'Terminé'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold gradient-text shrink-0">{completedSteps}/{steps.length}</span>
        </div>
        
        {/* Barre de progression compacte */}
        <div className="glass-light rounded-full h-2 overflow-hidden backdrop-blur-lg border border-white/20">
          <div
            className="gradient-primary h-2 rounded-full progress-bar-animated shadow-inner"
            style={{ '--progress-width': `${progressPercentage}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </nav>
  );
};

// Version intermédiaire pour tablettes
const TabletMobileProgress: React.FC<FormProgressProps> = ({ steps }) => {
  const currentStepIndex = steps.findIndex(step => step.current);
  const completedSteps = steps.filter(step => step.completed).length;
  const currentStep = steps[currentStepIndex];
  const progressPercentage = ((completedSteps + (currentStep ? 0.5 : 0)) / steps.length) * 100;
  
  return (
    <nav aria-label="Progress" className="w-full progress-mobile hidden sm:block md:hidden animate-fade-in">
      {/* Barre de progression globale avec glassmorphism */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold gradient-text">Progression</span>
          <span className="text-sm font-bold gradient-text">{completedSteps}/{steps.length} étapes</span>
        </div>
        <div className="glass-light rounded-full h-3 overflow-hidden backdrop-blur-lg border border-white/30">
          <div
            className="gradient-primary h-3 rounded-full progress-bar-animated shadow-inner animate-shimmer"
            style={{ '--progress-width': `${progressPercentage}%` } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Étape courante en évidence avec design moderne */}
      {currentStep && (
        <div className="glass-heavy rounded-xl p-4 current-step-highlight border border-white/20 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white shadow-2xl">
              <span className="text-sm font-bold">{currentStepIndex + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold gradient-text mb-1">Étape actuelle</p>
              <p className="text-base font-bold text-slate-900">{currentStep.title}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const DesktopProgress: React.FC<FormProgressProps> = ({ steps }) => {
  const progressPercentage = ((steps.filter(s => s.completed).length + (steps.find(s => s.current) ? 0.5 : 0)) / steps.length) * 100;
  
  // Calcul dynamique de l'espacement basé sur le nombre d'étapes
  const getStepSpacing = () => {
    if (steps.length <= 4) return 'gap-8 lg:gap-12';
    if (steps.length <= 6) return 'gap-6 lg:gap-8';
    if (steps.length <= 8) return 'gap-4 lg:gap-6';
    return 'gap-3 lg:gap-4';
  };
  
  // Calcul de la largeur des connecteurs basé sur l'espace disponible
  const getConnectorWidth = () => {
    if (steps.length <= 4) return '100px';
    if (steps.length <= 6) return '80px';
    if (steps.length <= 8) return '60px';
    return '40px';
  };
  
  // Taille des éléments basée sur le nombre d'étapes
  const getStepSize = () => {
    if (steps.length <= 6) return 'h-12 w-12';
    if (steps.length <= 8) return 'h-10 w-10';
    return 'h-9 w-9';
  };
  
  const getIconSize = () => {
    if (steps.length <= 6) return 'h-6 w-6';
    if (steps.length <= 8) return 'h-5 w-5';
    return 'h-4 w-4';
  };
  
  const getTextSize = () => {
    if (steps.length <= 6) return 'text-base';
    if (steps.length <= 8) return 'text-sm';
    return 'text-xs';
  };

  return (
    <nav aria-label="Progress" className="hidden md:block progress-horizontal animate-fade-in">
      <div className="glass-light rounded-2xl p-6 backdrop-blur-xl border border-white/20">
        <div className="w-full">
          <ol className={`grid items-center ${getStepSpacing()}`} style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
            {steps.map((step, stepIdx) => (
              <li 
                key={step.id} 
                className="relative flex flex-col items-center animate-slide-up"
                style={{animationDelay: `${stepIdx * 0.1}s`}}
              >
                <div className="flex flex-col items-center w-full">
                  <div className="relative">
                    <div className={`relative flex ${getStepSize()} items-center justify-center rounded-full transition-all duration-300 step-interactive micro-bounce ${
                      step.completed 
                        ? 'gradient-cool text-white shadow-xl hover:shadow-2xl animate-pulse-soft' 
                        : step.current 
                          ? 'gradient-primary text-white shadow-xl ring-4 ring-blue-400/30' 
                          : 'glass text-slate-600 border border-white/30 hover:glass-heavy'
                    }`}>
                      {step.completed ? <Check className={getIconSize()} /> : <span className={`${getTextSize()} font-bold`}>{stepIdx + 1}</span>}
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className={`absolute top-1/2 -translate-y-1/2 h-1 step-connector transition-all duration-500 rounded-full ${
                        step.completed ? 'gradient-cool shadow-lg' : 'glass border border-white/20'
                      }`} style={{ 
                        left: `calc(50% + ${steps.length <= 6 ? '24px' : steps.length <= 8 ? '20px' : '18px'})`,
                        width: getConnectorWidth()
                      }} />
                    )}
                  </div>
                  <div className="mt-3 text-center w-full px-1">
                    <span className={`step-title ${getTextSize()} font-semibold block transition-colors duration-300 leading-tight ${
                      step.current 
                        ? 'gradient-text' 
                        : step.completed 
                          ? 'text-green-600' 
                          : 'text-slate-600'
                    }`} style={{ 
                      lineHeight: '1.2',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}>
                      {step.title}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        
        <div className="mt-8 lg:mt-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold gradient-text">Progression globale</span>
            <span className="text-sm font-bold gradient-text">{steps.filter(s => s.completed).length}/{steps.length} terminées</span>
          </div>
          <div className="glass-light rounded-full h-3 overflow-hidden backdrop-blur-lg border border-white/30">
            <div 
              className="gradient-primary h-3 rounded-full progress-bar-animated shadow-inner animate-shimmer" 
              style={{ '--progress-width': `${progressPercentage}%` } as React.CSSProperties} 
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

const FormProgress: React.FC<FormProgressProps> = ({ steps }) => {
  return (
    <>
      <SimplifiedMobileProgress steps={steps} />
      <TabletMobileProgress steps={steps} />
      <DesktopProgress steps={steps} />
    </>
  );
};

export default FormProgress;
