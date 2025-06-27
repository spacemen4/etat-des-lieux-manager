
import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
}

interface FormProgressProps {
  steps: Step[];
}

const FormProgress: React.FC<FormProgressProps> = ({ steps }) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            <div className="flex items-center">
              <div className={`
                relative flex h-8 w-8 items-center justify-center rounded-full
                ${step.completed 
                  ? 'bg-green-600 text-white' 
                  : step.current 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }
              `}>
                {step.completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepIdx + 1}</span>
                )}
              </div>
              {stepIdx !== steps.length - 1 && (
                <div className={`
                  absolute top-4 h-0.5 w-8 sm:w-20 left-8
                  ${step.completed ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
            <div className="mt-2">
              <span className={`
                text-sm font-medium
                ${step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'}
              `}>
                {step.title}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default FormProgress;
