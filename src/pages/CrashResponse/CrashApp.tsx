import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Home } from "./Home";
import { SafetyCheck } from "./SafetyCheck";
import { EmergencyContacts } from "./EmergencyContacts";
import { Authorities } from "./Authorities";
import { InformationGathering } from "./InformationGathering";
import { ReportGeneration } from "./ReportGeneration";
import { trackEvent } from "@/lib/analytics";

type AppState = 'home' | 'safety-check' | 'emergency-contacts' | 'authorities' | 'information' | 'report';

export const CrashApp = () => {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [userResponses, setUserResponses] = useState({
    safetyStatus: '',
    authoritiesChoice: '',
    collectedInfo: {}
  });
  const appEntryFired = useRef(false);

  useEffect(() => {
    if (appEntryFired.current) return;
    appEntryFired.current = true;
    trackEvent('app_entry');
  }, []);

  const handleStartCrashReport = () => {
    trackEvent('step_1_safety_started');
    setCurrentState('safety-check');
  };

  const handleSafetyCheck = (safetyStatus: 'safe' | 'emergency') => {
    setUserResponses(prev => ({ ...prev, safetyStatus }));
    trackEvent('step_2_emergency_started', { safetyStatus });
    setCurrentState('emergency-contacts');
  };

  const handleAuthorities = (authoritiesChoice: 'emergency' | 'non-emergency' | 'skip') => {
    setUserResponses(prev => ({ ...prev, authoritiesChoice }));
    trackEvent('step_4_information_started', { authoritiesChoice });
    setCurrentState('information');
  };

  const handleInformationGathering = (collectedInfo: any) => {
    setUserResponses(prev => ({ ...prev, collectedInfo }));
    trackEvent('step_4_information_completed');
    setCurrentState('report');
  };

  const handleReportComplete = () => {
    setCurrentState('home');
    // Reset user responses for next use
    setUserResponses({
      safetyStatus: '',
      authoritiesChoice: '',
      collectedInfo: {}
    });
  };

  const handleGoBackToInformation = () => {
    setCurrentState('information');
  };

  const handleGoBackToHome = () => {
    setCurrentState('home');
  };

  const handleGoBackToSafetyCheck = () => {
    setCurrentState('safety-check');
  };

  const handleGoBackToEmergencyContacts = () => {
    setCurrentState('emergency-contacts');
  };

  const handleGoBackToAuthorities = () => {
    setCurrentState('authorities');
  };

  const handleEmergencyContacts = () => {
    trackEvent('step_3_authorities_started');
    setCurrentState('authorities');
  };

  const handleLogoClick = () => {
    setCurrentState('home');
    // Reset user responses when returning to home
    setUserResponses({
      safetyStatus: '',
      authoritiesChoice: '',
      collectedInfo: {}
    });
  };

  const renderCurrentScreen = () => {
    switch (currentState) {
      case 'home':
        return <Home onStartCrashReport={handleStartCrashReport} />;
      case 'safety-check':
        return <SafetyCheck onNext={handleSafetyCheck} onGoBack={handleGoBackToHome} />;
      case 'emergency-contacts':
        return <EmergencyContacts onNext={handleEmergencyContacts} onGoBack={handleGoBackToSafetyCheck} />;
      case 'authorities':
        return <Authorities onNext={handleAuthorities} onGoBack={handleGoBackToEmergencyContacts} />;
      case 'information':
        return <InformationGathering onNext={handleInformationGathering} onGoBack={handleGoBackToAuthorities} />;
      case 'report':
        return <ReportGeneration collectedInfo={userResponses.collectedInfo} onComplete={handleReportComplete} onGoBack={handleGoBackToInformation} />;
      default:
        return <Home onStartCrashReport={handleStartCrashReport} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onHomeClick={handleLogoClick} />
      {renderCurrentScreen()}
    </div>
  );
};