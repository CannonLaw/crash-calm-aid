import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { EmergencyButton } from "@/components/CrashApp/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, AlertTriangle, MoveRight } from "lucide-react";

interface SafetyCheckProps {
  onNext: (safetyStatus: 'safe' | 'moving' | 'emergency') => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const SafetyCheck = ({ onNext }: SafetyCheckProps) => {
  const handleEmergencyHelp = () => {
    // In a real app, this would make an actual emergency call
    window.open('tel:911');
    onNext('emergency');
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressIndicator 
        currentStep={1} 
        totalSteps={5} 
        stepTitles={stepTitles}
      />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Safety First
            </h1>
            <p className="text-muted-foreground">
              Let's make sure you're safe before we continue
            </p>
          </div>

          {/* Safety Options */}
          <div className="space-y-4 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-center">
                Are you currently safe?
              </h3>
              
              <div className="space-y-4">
                {/* Safe Option */}
                <PrimaryActionButton
                  onClick={() => onNext('safe')}
                  icon={Shield}
                >
                  Yes, I'm safe
                </PrimaryActionButton>

                {/* Need to move Option */}
                <Button
                  onClick={() => onNext('moving')}
                  variant="outline"
                  className="w-full h-14 text-base font-medium"
                >
                  <MoveRight className="w-5 h-5 mr-3" />
                  I need to move to safety
                </Button>

                {/* Emergency Option */}
                <div className="pt-2">
                  <EmergencyButton onClick={handleEmergencyHelp} />
                </div>
              </div>
            </Card>
          </div>

          {/* Safety Tips */}
          <Card className="p-4 bg-secondary">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-2">Safety Reminders:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Turn on hazard lights if possible</li>
                  <li>• Move to a safe location if you can</li>
                  <li>• Stay in your vehicle if on a busy road</li>
                  <li>• Call 911 if anyone is injured</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};