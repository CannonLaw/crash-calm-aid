import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export const ProgressIndicator = ({ currentStep, totalSteps, stepTitles }: ProgressIndicatorProps) => {
  return (
    <div className="w-full bg-white shadow-sm border-b border-border p-4">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              <div 
                className={`progress-step ${
                  isActive ? 'active' : 
                  isCompleted ? 'completed' : 
                  'upcoming'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              {index < totalSteps - 1 && (
                <div 
                  className={`h-0.5 w-8 mx-2 ${
                    isCompleted ? 'bg-primary' : 'bg-secondary'
                  }`} 
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-sm text-muted-foreground text-center">
        Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
      </div>
    </div>
  );
};