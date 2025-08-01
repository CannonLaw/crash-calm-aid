import { useState } from "react";
import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Phone, MessageSquare, ChevronRight } from "lucide-react";

interface EmergencyContactsProps {
  onNext: () => void;
  onGoBack: () => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const EmergencyContacts = ({ onNext, onGoBack }: EmergencyContactsProps) => {
  const [contactNotified, setContactNotified] = useState(false);

  // Mock emergency contact - in real app this would come from user settings
  const emergencyContact = {
    name: "Sarah Johnson",
    relationship: "Spouse",
    phone: "(555) 123-4567"
  };

  const handleCall = () => {
    window.open('tel:');
    setContactNotified(true);
  };

  const handleText = () => {
    window.open('sms:');
    setContactNotified(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressIndicator 
        currentStep={2} 
        totalSteps={5} 
        stepTitles={stepTitles}
      />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Notify Someone
            </h1>
            <p className="text-muted-foreground">
              Let someone know about the accident
            </p>
          </div>

          {/* Emergency Contact Card */}
          <Card className="p-6 mb-6">

            <div className="space-y-3">
              <Button
                onClick={handleCall}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <Phone className="w-5 h-5 mr-3" />
                Make a Call
              </Button>

              <Button
                onClick={handleText}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Send a Text Message
              </Button>
            </div>

            {contactNotified && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium text-center">
                  ✓ Contact action completed
                </p>
              </div>
            )}
          </Card>


          {/* Continue Button */}
          <div className="space-y-4">
            <PrimaryActionButton onClick={onNext}>
              Continue to Authorities
            </PrimaryActionButton>
            
            <Button 
              variant="outline" 
              onClick={onNext}
              className="w-full"
            >
              Skip This Step
            </Button>
          </div>

          {/* Info */}
          <Card className="mt-6 p-4 bg-secondary">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Why notify someone?</p>
              <p>
                It's important to let someone know about your situation, especially if you're shaken up or need support.
              </p>
            </div>
          </Card>

          {/* Go Back Button */}
          <div className="text-center mt-4">
            <Button 
              variant="outline" 
              onClick={onGoBack}
              className="flex items-center gap-2"
            >
              <span>←</span>
              Go Back to Safety Check
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};