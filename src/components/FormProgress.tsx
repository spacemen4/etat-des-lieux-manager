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

const MobileProgress: React.FC<FormProgressProps> = ({ steps }) => {
  const currentStepIndex = steps.findIndex(step => step.current);
  const completedSteps = steps.filter(step => step.completed).length;
  const currentStep = steps[currentStepIndex];
  const progressPercentage = ((completedSteps + (currentStep ? 0.5 : 0)) / steps.length) * 100;
  
  return (
    <nav aria-label="Progress" className="w-full progress-mobile md:hidden">
      {/* Barre de progression globale */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Progression</span>
          <span className="text-sm font-medium text-primary">{completedSteps}/{steps.length} étapes</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full progress-bar-animated"
            style={{ '--progress-width': `${progressPercentage}%` } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Étape courante en évidence */}
      {currentStep && (
        <div className="glass-light rounded-lg p-4 mb-4 current-step-highlight step-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-bounce-smooth">
              <span className="text-sm font-bold">{currentStepIndex + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary mb-1">Étape actuelle</p>
              <p className="text-base font-semibold">{currentStep.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liste déroulante des étapes */}
      <div className="space-y-2 step-list">
        {steps.map((step, stepIdx) => (
          <div key={step.id} className={`flex items-center gap-3 step-compact step-interactive transition-all duration-200 ${step.current ? 'bg-primary/10 border border-primary/20' : step.completed ? 'bg-green-50/70 border border-green-200/80' : 'bg-muted/60'}`}>
            <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all duration-200 ${step.completed ? 'bg-green-600 text-white shadow-sm' : step.current ? 'bg-primary text-primary-foreground shadow-sm step-pulse' : 'bg-muted text-muted-foreground'}`}>
              {step.completed ? <Check className="h-3 w-3" /> : <span className="text-xs font-medium">{stepIdx + 1}</span>}
            </div>
            <span className={`text-sm font-medium flex-1 leading-tight ${step.current ? 'text-primary font-semibold' : step.completed ? 'text-green-700' : 'text-muted-foreground'}`}>{step.title}</span>
            {step.current && <ChevronRight className="h-4 w-4 text-primary animate-pulse" />}
          </div>
        ))}
      </div>
    </nav>
  );
};

const DesktopProgress: React.FC<FormProgressProps> = ({ steps }) => {
  const progressPercentage = ((steps.filter(s => s.completed).length + (steps.find(s => s.current) ? 0.5 : 0)) / steps.length) * 100;

  return (
    <nav aria-label="Progress" className="hidden md:block progress-horizontal">
      <ol className="flex items-center justify-between lg:justify-start lg:space-x-4 xl:space-x-8 overflow-x-auto pb-2">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'lg:pr-4 xl:pr-8' : ''} flex-1 lg:flex-none min-w-0`}>
            <div className="flex flex-col lg:flex-row items-center lg:items-start">
              <div className="flex items-center relative">
                <div className={`relative flex h-8 w-8 lg:h-10 lg:w-10 xl:h-8 xl:w-8 items-center justify-center rounded-full transition-all duration-300 step-interactive ${step.completed ? 'bg-green-600 text-white shadow-lg hover:shadow-xl' : step.current ? 'bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 step-pulse' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {step.completed ? <Check className="h-4 w-4 lg:h-5 lg:w-5 xl:h-4 xl:w-4" /> : <span className="text-xs lg:text-sm font-medium">{stepIdx + 1}</span>}
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className={`absolute top-4 lg:top-5 xl:top-4 h-0.5 left-8 lg:left-10 xl:left-8 hidden lg:block step-connector transition-all duration-300 ${step.completed ? 'bg-green-600 shadow-sm' : 'bg-muted'}`} style={{ width: '60px' }} />
                )}
              </div>
              <div className="mt-2 lg:mt-0 lg:ml-3 text-center lg:text-left">
                <span className={`step-title text-xs lg:text-sm font-medium block transition-colors duration-200 ${step.current ? 'text-primary font-semibold' : step.completed ? 'text-green-600' : 'text-muted-foreground'}`} style={{ maxWidth: '80px', lineHeight: '1.2', wordBreak: 'break-word' }}>
                  {step.title}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
      
      <div className="mt-6 lg:mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Progression globale</span>
          <span className="text-xs text-primary font-medium">{steps.filter(s => s.completed).length}/{steps.length} terminées</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-primary h-2 rounded-full progress-bar-animated shadow-sm" style={{ '--progress-width': `${progressPercentage}%` } as React.CSSProperties} />
        </div>
      </div>
    </nav>
  );
};

const FormProgress: React.FC<FormProgressProps> = ({ steps }) => {
  return (
    <>
      <MobileProgress steps={steps} />
      <DesktopProgress steps={steps} />
    </>
  );
};

export default FormProgress;
