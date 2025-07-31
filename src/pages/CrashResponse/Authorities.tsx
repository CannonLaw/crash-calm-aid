import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { EmergencyButton } from "@/components/CrashApp/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, ShieldCheck, Phone, MapPin } from "lucide-react";

interface AuthoritiesProps {
  onNext: (authoritiesChoice: 'emergency' | 'non-emergency' | 'skip') => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const Authorities = ({ onNext }: AuthoritiesProps) => {
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
                <p className="text-sm text-muted-foreground mb-2">
                  For property damage without injuries
                </p>
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
                <h3 className="font-semibold">No Injuries or Danger</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Minor accident with no immediate police response needed
                </p>
                <p className="text-xs text-muted-foreground bg-background p-2 rounded border">
                  ⚠️ Note: Some jurisdictions legally require police notification for any accident. Check your local laws.
                </p>
              </div>
              <PrimaryActionButton onClick={() => onNext("skip")}>
                Continue Without Authorities
              </PrimaryActionButton>
            </Card>
          </div>

          {/* Information */}
          <Card className="p-4 bg-secondary">
            <div className="text-sm">
              <p className="font-medium mb-2">When to call authorities:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Any injuries, no matter how minor</li>
                <li>• Significant property damage</li>
                <li>• Disagreement about what happened</li>
                <li>• Hit and run incident</li>
                <li>• Driver appears impaired</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};