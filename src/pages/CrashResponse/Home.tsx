import { useState } from "react";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { EmergencyButton } from "@/components/CrashApp/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FileText, Users, Settings, Phone } from "lucide-react";
import logo from "@/assets/crash-genius-logo.png";

interface HomeProps {
  onStartCrashReport: () => void;
}

export const Home = ({ onStartCrashReport }: HomeProps) => {
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  const handleEmergencyCall = () => {
    if (showEmergencyConfirm) {
      // In a real app, this would make an actual emergency call
      window.open('tel:911');
    } else {
      setShowEmergencyConfirm(true);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <img 
            src={logo} 
            alt="Crash Genius Logo" 
            className="w-24 h-24 mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Cannon Law Crash Genius
          </h1>
          <p className="text-muted-foreground">
            Start a Crash Report for a step by step guide to handling a motor vehicle collision.
          </p>
        </div>

        {/* Main Action */}
        <div className="mb-8">
          <PrimaryActionButton 
            onClick={onStartCrashReport}
            icon={AlertTriangle}
            className="mb-6 text-xl py-6"
          >
            Start Crash Report
          </PrimaryActionButton>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Begin the guided accident documentation process
          </p>
        </div>

        {/* Emergency Section */}
        {showEmergencyConfirm ? (
          <Card className="p-6 mb-6 border-destructive">
            <div className="text-center">
              <Phone className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Call Emergency Services?</h3>
              <p className="text-muted-foreground mb-6">
                This will immediately call 911. Only use if there are injuries or immediate danger.
              </p>
              <div className="space-y-3">
                <EmergencyButton onClick={handleEmergencyCall} />
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmergencyConfirm(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Need Emergency Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If anyone is injured or in immediate danger
              </p>
              <Button 
                onClick={() => setShowEmergencyConfirm(true)}
                className="emergency-btn w-full"
              >
                <Phone className="w-5 h-5 mr-2" />
                Emergency Services
              </Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};