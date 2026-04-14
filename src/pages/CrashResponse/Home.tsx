import { useState } from "react";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { EmergencyButton } from "@/components/CrashApp/EmergencyButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FileText, Users, Settings, Phone, LogIn } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/crash-genius-logo.png";

interface HomeProps {
  onStartCrashReport: () => void;
}

export const Home = ({ onStartCrashReport }: HomeProps) => {
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEmergencyCall = () => {
    if (showEmergencyConfirm) {
      // In a real app, this would make an actual emergency call
      window.open('tel:911');
    } else {
      setShowEmergencyConfirm(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  const handleViewReports = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowAuthModal(true);
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
          <h1 className="font-bold text-foreground mb-2">
            <div className="text-4xl"><span className="text-primary">CRASH</span> GENIUS</div>
            <div className="text-2xl">from</div>
            <div className="text-4xl">CANNON <span className="text-primary">LAW</span></div>
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

        {/* User Account Section */}
        <Card className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Account
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {user 
                ? 'View your saved accident reports and account details'
                : 'Sign in to access your saved reports from anywhere'
              }
            </p>
            <Button 
              onClick={handleViewReports}
              variant="outline"
              className="w-full"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login/Create Account
            </Button>
          </div>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8 mb-4 px-2">
          Crash Genius is a service provided by Cannon Law, a law firm based in Fort Collins, Colorado. No attorney-client relationship is formed through the use of this service. Each case is unique and previous results are not a guarantee of future results. If you would like to discuss whether we are able to represent you, please visit{' '}
          <a href="https://www.cannonlaw.com" className="underline">cannonlaw.com</a>{' '}
          or call (970) 471-7170.
        </p>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};