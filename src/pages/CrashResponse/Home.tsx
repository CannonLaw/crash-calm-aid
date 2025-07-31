import { useState } from "react";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { EmergencyButton } from "@/components/CrashApp/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FileText, Users, Settings, Phone } from "lucide-react";

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Crash Calm Aid
          </h1>
          <p className="text-muted-foreground">
            Stay calm. We'll guide you through this step by step.
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

        {/* Main Action */}
        <div className="mb-8">
          <PrimaryActionButton 
            onClick={onStartCrashReport}
            icon={AlertTriangle}
            className="mb-4"
          >
            Start Crash Report
          </PrimaryActionButton>
          <p className="text-sm text-muted-foreground text-center">
            Begin the guided accident documentation process
          </p>
        </div>

        {/* Quick Access */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
          
          <Button variant="outline" className="w-full justify-start h-12">
            <FileText className="w-5 h-5 mr-3" />
            Previous Reports
          </Button>
          
          <Button variant="outline" className="w-full justify-start h-12">
            <Users className="w-5 h-5 mr-3" />
            Emergency Contacts
          </Button>
          
          <Button variant="outline" className="w-full justify-start h-12">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
        </div>

        {/* Auto-Detection Notice */}
        <Card className="mt-8 p-4 bg-secondary">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Auto-Detection Active</p>
              <p className="text-muted-foreground">
                This app can detect potential crashes using your phone's sensors and will notify you automatically.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};