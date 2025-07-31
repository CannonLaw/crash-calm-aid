import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyButtonProps {
  onClick: () => void;
  className?: string;
}

export const EmergencyButton = ({ onClick, className = "" }: EmergencyButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={`emergency-btn w-full text-lg font-semibold ${className}`}
    >
      <Phone className="w-6 h-6 mr-3" />
      Call 911 Now
    </Button>
  );
};