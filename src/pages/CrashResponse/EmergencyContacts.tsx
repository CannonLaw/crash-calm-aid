import { useState } from "react";
import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Phone, MessageSquare, ChevronRight } from "lucide-react";

interface EmergencyContactsProps {
  onNext: () => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const EmergencyContacts = ({ onNext }: EmergencyContactsProps) => {
  const [contactNotified, setContactNotified] = useState(false);

  // Mock emergency contact - in real app this would come from user settings
  const emergencyContact = {
    name: "Sarah Johnson",
    relationship: "Spouse",
    phone: "(555) 123-4567"
  };

  const handleCall = () => {
    window.open(`tel:${emergencyContact.phone}`);
    setContactNotified(true);
  };

  const handleText = () => {
    const message = encodeURIComponent("I've been in a car accident. I'm okay but wanted to let you know. I'm using Cannon Law Crash Genius to handle the situation.");
    window.open(`sms:${emergencyContact.phone}?body=${message}`);
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
              Notify Your Contact
            </h1>
            <p className="text-muted-foreground">
              Let someone know about the accident
            </p>
          </div>

          {/* Emergency Contact Card */}
          <Card className="p-6 mb-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Contact</h3>
              <div className="bg-secondary rounded-lg p-4">
                <p className="font-medium text-lg">{emergencyContact.name}</p>
                <p className="text-muted-foreground">{emergencyContact.relationship}</p>
                <p className="text-sm text-muted-foreground mt-1">{emergencyContact.phone}</p>
              </div>
            </div>

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

          {/* No Contact Option */}
          <Card className="p-4 mb-6 bg-secondary">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-0"
              onClick={() => {}}
            >
              <span className="text-sm">No emergency contact set up</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
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
        </div>
      </div>
    </div>
  );
};