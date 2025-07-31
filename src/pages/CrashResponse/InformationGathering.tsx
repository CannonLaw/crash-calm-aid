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
  Check,
  Plus,
  Trash2
} from "lucide-react";

interface InformationGatheringProps {
  onNext: (collectedInfo: any) => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

interface CollectedInfo {
  userInfo: {
    name: string;
    phone: string;
    license: string;
    insurance: string;
    policy: string;
  };
  otherDrivers: any[];
  vehicles: any[];
  witnesses: any[];
  photos: string[];
  noOtherDrivers: boolean;
  noOtherVehicles: boolean;
  noWitnesses: boolean;
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
    userInfo: {
      name: '',
      phone: '',
      license: '',
      insurance: '',
      policy: ''
    },
    otherDrivers: [],
    vehicles: [{ make: '', model: '', color: '', plate: '', associatedDriver: '' }],
    witnesses: [],
    photos: [],
    noOtherDrivers: false,
    noOtherVehicles: false,
    noWitnesses: false,
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

  const updateUserInfo = (field: string, value: string) => {
    setCollectedInfo(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, [field]: value }
    }));
  };

  const addOtherDriver = () => {
    setCollectedInfo(prev => ({
      ...prev,
      otherDrivers: [...prev.otherDrivers, { name: '', phone: '', license: '', insurance: '', policy: '' }]
    }));
  };

  const removeOtherDriver = (index: number) => {
    setCollectedInfo(prev => ({
      ...prev,
      otherDrivers: prev.otherDrivers.filter((_, i) => i !== index)
    }));
  };

  const addVehicle = () => {
    setCollectedInfo(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { make: '', model: '', color: '', plate: '', associatedDriver: '' }]
    }));
  };

  const removeVehicle = (index: number) => {
    setCollectedInfo(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index)
    }));
  };

  const addWitness = () => {
    setCollectedInfo(prev => ({
      ...prev,
      witnesses: [...prev.witnesses, { name: '', contact: '', description: '' }]
    }));
  };

  const removeWitness = (index: number) => {
    setCollectedInfo(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index)
    }));
  };

  const toggleNoOtherDrivers = () => {
    setCollectedInfo(prev => ({
      ...prev,
      noOtherDrivers: !prev.noOtherDrivers,
      otherDrivers: !prev.noOtherDrivers ? [] : prev.otherDrivers
    }));
  };

  const toggleNoOtherVehicles = () => {
    setCollectedInfo(prev => ({
      ...prev,
      noOtherVehicles: !prev.noOtherVehicles,
      vehicles: !prev.noOtherVehicles ? [] : prev.vehicles
    }));
  };

  const toggleNoWitnesses = () => {
    setCollectedInfo(prev => ({
      ...prev,
      noWitnesses: !prev.noWitnesses,
      witnesses: !prev.noWitnesses ? [] : prev.witnesses
    }));
  };

  const sections = [
    {
      id: 'userInfo',
      title: 'Your Information',
      icon: User,
      content: (
        <div className="space-y-3">
          <Input
            placeholder="Full name"
            value={collectedInfo.userInfo.name}
            onChange={(e) => updateUserInfo('name', e.target.value)}
          />
          <Input
            placeholder="Phone number"
            type="tel"
            value={collectedInfo.userInfo.phone}
            onChange={(e) => updateUserInfo('phone', e.target.value)}
          />
          <Input
            placeholder="License number"
            value={collectedInfo.userInfo.license}
            onChange={(e) => updateUserInfo('license', e.target.value)}
          />
          <Input
            placeholder="Insurance company"
            value={collectedInfo.userInfo.insurance}
            onChange={(e) => updateUserInfo('insurance', e.target.value)}
          />
          <Input
            placeholder="Policy number"
            value={collectedInfo.userInfo.policy}
            onChange={(e) => updateUserInfo('policy', e.target.value)}
          />
        </div>
      )
    },
    {
      id: 'drivers',
      title: 'Other Driver(s)',
      icon: User,
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="no-other-drivers"
              checked={collectedInfo.noOtherDrivers}
              onChange={toggleNoOtherDrivers}
              className="rounded border border-input"
            />
            <label htmlFor="no-other-drivers" className="text-sm font-medium">
              No other drivers involved (single car accident)
            </label>
          </div>
          
          {!collectedInfo.noOtherDrivers && (
            <>
              {collectedInfo.otherDrivers.map((driver, index) => (
                <div key={index} className="space-y-3 border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm">Driver {index + 1}</h4>
                    {collectedInfo.otherDrivers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOtherDriver(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
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
              
              <Button
                variant="outline"
                onClick={addOtherDriver}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </>
          )}
        </div>
      )
    },
    {
      id: 'vehicles',
      title: 'Vehicle(s)',
      icon: Car,
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="no-other-vehicles"
              checked={collectedInfo.noOtherVehicles}
              onChange={toggleNoOtherVehicles}
              className="rounded border border-input"
            />
            <label htmlFor="no-other-vehicles" className="text-sm font-medium">
              No other vehicles involved (only your vehicle)
            </label>
          </div>
          
          {!collectedInfo.noOtherVehicles && (
            <>
              {collectedInfo.vehicles.map((vehicle, index) => (
                <div key={index} className="space-y-3 border border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm">Vehicle {index + 1}</h4>
                    {collectedInfo.vehicles.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVehicle(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
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
                  <Input
                    placeholder="Associated driver (e.g., 'Driver 1', 'Your vehicle', etc.)"
                    value={vehicle.associatedDriver}
                    onChange={(e) => updateVehicle(index, 'associatedDriver', e.target.value)}
                  />
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addVehicle}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </>
          )}
        </div>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      icon: Users,
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="no-witnesses"
              checked={collectedInfo.noWitnesses}
              onChange={toggleNoWitnesses}
              className="rounded border border-input"
            />
            <label htmlFor="no-witnesses" className="text-sm font-medium">
              No witnesses present
            </label>
          </div>

          {!collectedInfo.noWitnesses && (
            <>
              {collectedInfo.witnesses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No witnesses recorded yet
                </p>
              ) : (
                collectedInfo.witnesses.map((witness, index) => (
                  <div key={index} className="space-y-3 border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-sm">Witness {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWitness(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
                    <Input
                      placeholder="Description (e.g., passenger, bystander, pedestrian)"
                      value={witness.description}
                      onChange={(e) => updateWitness(index, 'description', e.target.value)}
                    />
                  </div>
                ))
              )}
              
              <Button
                variant="outline"
                onClick={addWitness}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Witness
              </Button>
            </>
          )}
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