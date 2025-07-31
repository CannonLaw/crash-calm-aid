import { useState } from "react";
import { Home } from "./Home";
import { SafetyCheck } from "./SafetyCheck";
import { EmergencyContacts } from "./EmergencyContacts";

type AppState = 'home' | 'safety-check' | 'emergency-contacts' | 'authorities' | 'information' | 'report';

export const CrashApp = () => {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [userResponses, setUserResponses] = useState({
    safetyStatus: '',
    emergencyContactNotified: false,
    authoritiesNeeded: '',
    collectedInfo: {}
  });

  const handleStartCrashReport = () => {
    setCurrentState('safety-check');
  };

  const handleSafetyCheck = (safetyStatus: 'safe' | 'moving' | 'emergency') => {
    setUserResponses(prev => ({ ...prev, safetyStatus }));
    setCurrentState('emergency-contacts');
  };

  const handleEmergencyContacts = () => {
    setCurrentState('authorities');
  };

  const renderCurrentScreen = () => {
    switch (currentState) {
      case 'home':
        return <Home onStartCrashReport={handleStartCrashReport} />;
      case 'safety-check':
        return <SafetyCheck onNext={handleSafetyCheck} />;
      case 'emergency-contacts':
        return <EmergencyContacts onNext={handleEmergencyContacts} />;
      default:
        return <Home onStartCrashReport={handleStartCrashReport} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentScreen()}
    </div>
  );
};