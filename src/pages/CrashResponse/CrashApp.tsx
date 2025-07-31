import { useState } from "react";
import { Home } from "./Home";
import { SafetyCheck } from "./SafetyCheck";
import { EmergencyContacts } from "./EmergencyContacts";
import { Authorities } from "./Authorities";
import { InformationGathering } from "./InformationGathering";
import { ReportGeneration } from "./ReportGeneration";

type AppState = 'home' | 'safety-check' | 'emergency-contacts' | 'authorities' | 'information' | 'report';

export const CrashApp = () => {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [userResponses, setUserResponses] = useState({
    safetyStatus: '',
    emergencyContactNotified: false,
    authoritiesChoice: '',
    collectedInfo: {}
  });

  const handleStartCrashReport = () => {
    setCurrentState('safety-check');
  };

  const handleSafetyCheck = (safetyStatus: 'safe' | 'moving' | 'emergency') => {
    setUserResponses(prev => ({ ...prev, safetyStatus }));
    setCurrentState('emergency-contacts');
  };

  const handleAuthorities = (authoritiesChoice: 'emergency' | 'non-emergency' | 'skip') => {
    setUserResponses(prev => ({ ...prev, authoritiesChoice }));
    setCurrentState('information');
  };

  const handleInformationGathering = (collectedInfo: any) => {
    setUserResponses(prev => ({ ...prev, collectedInfo }));
    setCurrentState('report');
  };

  const handleReportComplete = () => {
    setCurrentState('home');
    // Reset user responses for next use
    setUserResponses({
      safetyStatus: '',
      emergencyContactNotified: false,
      authoritiesChoice: '',
      collectedInfo: {}
    });
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
      case 'authorities':
        return <Authorities onNext={handleAuthorities} />;
      case 'information':
        return <InformationGathering onNext={handleInformationGathering} />;
      case 'report':
        return <ReportGeneration collectedInfo={userResponses.collectedInfo} onComplete={handleReportComplete} />;
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