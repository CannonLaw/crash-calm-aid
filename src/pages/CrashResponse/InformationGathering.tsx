import { useState } from "react";
import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  User, 
  Car, 
  Users, 
  Camera, 
  MapPin,
  Check
} from "lucide-react";

interface InformationGatheringProps {
  onNext: (collectedInfo: any) => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

interface CollectedInfo {
  otherDrivers: any[];
  vehicles: any[];
  witnesses: any[];
  photos: string[];
  accidentDetails: {
    location: string;
    description: string;
    dateTime: string;
  };
}

export const InformationGathering = ({ onNext }: InformationGatheringProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [collectedInfo, setCollectedInfo] = useState<CollectedInfo>({
    otherDrivers: [{ name: '', phone: '', license: '', insurance: '', policy: '' }],
    vehicles: [{ make: '', model: '', color: '', plate: '', owner: 'other' }],
    witnesses: [{ name: '', contact: '' }],
    photos: [],
    accidentDetails: {
      location: '',
      description: '',
      dateTime: new Date().toISOString().slice(0, 16)
    }
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const markSectionComplete = (section: string) => {
    setCompletedSections(prev => ({ ...prev, [section]: true }));
  };

  const updateOtherDriver = (index: number, field: string, value: string) => {
    const updated = [...collectedInfo.otherDrivers];
    updated[index] = { ...updated[index], [field]: value };
    setCollectedInfo(prev => ({ ...prev, otherDrivers: updated }));
  };

  const updateVehicle = (index: number, field: string, value: string) => {
    const updated = [...collectedInfo.vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setCollectedInfo(prev => ({ ...prev, vehicles: updated }));
  };

  const updateWitness = (index: number, field: string, value: string) => {
    const updated = [...collectedInfo.witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setCollectedInfo(prev => ({ ...prev, witnesses: updated }));
  };

  const updateAccidentDetails = (field: string, value: string) => {
    setCollectedInfo(prev => ({
      ...prev,
      accidentDetails: { ...prev.accidentDetails, [field]: value }
    }));
  };

  const sections = [
    {
      id: 'drivers',
      title: 'Other Driver(s)',
      icon: User,
      content: (
        <div className="space-y-4">
          {collectedInfo.otherDrivers.map((driver, index) => (
            <div key={index} className="space-y-3 border-b border-border pb-4 last:border-b-0">
              <Input
                placeholder="Full name"
                value={driver.name}
                onChange={(e) => updateOtherDriver(index, 'name', e.target.value)}
              />
              <Input
                placeholder="Phone number"
                type="tel"
                value={driver.phone}
                onChange={(e) => updateOtherDriver(index, 'phone', e.target.value)}
              />
              <Input
                placeholder="License number"
                value={driver.license}
                onChange={(e) => updateOtherDriver(index, 'license', e.target.value)}
              />
              <Input
                placeholder="Insurance company"
                value={driver.insurance}
                onChange={(e) => updateOtherDriver(index, 'insurance', e.target.value)}
              />
              <Input
                placeholder="Policy number"
                value={driver.policy}
                onChange={(e) => updateOtherDriver(index, 'policy', e.target.value)}
              />
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'vehicles',
      title: 'Vehicle(s)',
      icon: Car,
      content: (
        <div className="space-y-4">
          {collectedInfo.vehicles.map((vehicle, index) => (
            <div key={index} className="space-y-3 border-b border-border pb-4 last:border-b-0">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Make"
                  value={vehicle.make}
                  onChange={(e) => updateVehicle(index, 'make', e.target.value)}
                />
                <Input
                  placeholder="Model"
                  value={vehicle.model}
                  onChange={(e) => updateVehicle(index, 'model', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Color"
                  value={vehicle.color}
                  onChange={(e) => updateVehicle(index, 'color', e.target.value)}
                />
                <Input
                  placeholder="License plate"
                  value={vehicle.plate}
                  onChange={(e) => updateVehicle(index, 'plate', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      icon: Users,
      content: (
        <div className="space-y-4">
          {collectedInfo.witnesses.map((witness, index) => (
            <div key={index} className="space-y-3 border-b border-border pb-4 last:border-b-0">
              <Input
                placeholder="Witness name"
                value={witness.name}
                onChange={(e) => updateWitness(index, 'name', e.target.value)}
              />
              <Input
                placeholder="Contact information"
                value={witness.contact}
                onChange={(e) => updateWitness(index, 'contact', e.target.value)}
              />
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'photos',
      title: 'Photos',
      icon: Camera,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Vehicle Damage</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Accident Scene</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">License/Insurance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Other Vehicle</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Take photos from multiple angles. Include close-ups of damage and wide shots of the scene.
          </p>
        </div>
      )
    },
    {
      id: 'details',
      title: 'Accident Details',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Date & Time</label>
            <Input
              type="datetime-local"
              value={collectedInfo.accidentDetails.dateTime}
              onChange={(e) => updateAccidentDetails('dateTime', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Location</label>
            <Input
              placeholder="Street address or intersection"
              value={collectedInfo.accidentDetails.location}
              onChange={(e) => updateAccidentDetails('location', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              placeholder="Describe what happened in your own words..."
              value={collectedInfo.accidentDetails.description}
              onChange={(e) => updateAccidentDetails('description', e.target.value)}
              rows={4}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ProgressIndicator 
        currentStep={4} 
        totalSteps={5} 
        stepTitles={stepTitles}
      />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6 pt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Gather Information
            </h1>
            <p className="text-muted-foreground">
              Collect details for your accident report
            </p>
          </div>

          {/* Information Sections */}
          <div className="space-y-3 mb-8">
            {sections.map((section) => {
              const Icon = section.icon;
              const isOpen = openSections[section.id];
              const isCompleted = completedSections[section.id];

              return (
                <Card key={section.id} className="overflow-hidden">
                  <Collapsible 
                    open={isOpen} 
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-4 h-auto"
                      >
                        <div className="flex items-center">
                          <Icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{section.title}</span>
                          {isCompleted && (
                            <Check className="w-4 h-4 ml-2 text-primary" />
                          )}
                        </div>
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 pt-0">
                      {section.content}
                      <Button 
                        onClick={() => markSectionComplete(section.id)}
                        variant="outline" 
                        size="sm" 
                        className="mt-4 w-full"
                      >
                        {isCompleted ? 'Update Section' : 'Mark Complete'}
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          {/* Continue Button */}
          <PrimaryActionButton onClick={() => onNext(collectedInfo)}>
            Generate Report
          </PrimaryActionButton>

          {/* Auto-save indicator */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            All information is automatically saved
          </p>
        </div>
      </div>
    </div>
  );
};