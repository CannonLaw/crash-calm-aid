import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { EmergencyButton } from "@/components/CrashApp/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, ShieldCheck, Phone, MapPin } from "lucide-react";

interface AuthoritiesProps {
  onNext: (authoritiesChoice: 'emergency' | 'non-emergency' | 'skip') => void;
  onGoBack: () => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const Authorities = ({ onNext, onGoBack }: AuthoritiesProps) => {
  const handleEmergencyServices = () => {
    window.open('tel:911');
    onNext('emergency');
  };

  const handleNonEmergency = () => {
    // In a real app, this would lookup local non-emergency numbers based on location
    window.open('tel:311'); // Using 311 as example
    onNext('non-emergency');
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressIndicator 
        currentStep={3} 
        totalSteps={5} 
        stepTitles={stepTitles}
      />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Badge className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Contact Authorities
            </h1>
            <p className="text-muted-foreground">
              Do you need to contact emergency services?
            </p>
          </div>

          {/* Authority Options */}
          <div className="space-y-4 mb-8">
            {/* Emergency Services */}
            <Card className="p-6 border-destructive/20">
              <div className="text-center mb-4">
                <Phone className="w-8 h-8 text-destructive mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Emergency Services</h3>
                <p className="text-sm text-muted-foreground">
                  Call if there are injuries or immediate danger
                </p>
              </div>
              <EmergencyButton onClick={handleEmergencyServices} />
            </Card>

            {/* Non-Emergency Police */}
            <Card className="p-6">
              <div className="text-center mb-4">
                <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Non-Emergency Contact</h3>
              </div>
              <Button
                onClick={handleNonEmergency}
                variant="outline"
                className="w-full h-12 text-base font-medium"
              >
                <Phone className="w-5 h-5 mr-3" />
                Call 311
              </Button>
            </Card>

            {/* Skip Option */}
            <Card className="p-6 bg-secondary">
              <div className="text-center mb-4">
              </div>
              <PrimaryActionButton onClick={() => onNext("skip")}>
                Continue Without Authorities
              </PrimaryActionButton>
              <p className="text-xs text-muted-foreground bg-background p-2 rounded border mt-4">
                ⚠️ Note: Some jurisdictions legally require police notification for any accident. Check your local laws.
              </p>
            </Card>
          </div>

          {/* Go Back Button */}
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={onGoBack}
              className="flex items-center gap-2"
            >
              <span>←</span>
              Go Back to Emergency Contacts
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};