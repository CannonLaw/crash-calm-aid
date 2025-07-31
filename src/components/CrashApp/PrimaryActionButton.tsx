import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface PrimaryActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

export const PrimaryActionButton = ({ 
  onClick, 
  children, 
  icon: Icon, 
  className = "",
  disabled = false 
}: PrimaryActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`primary-action w-full text-lg font-semibold ${className}`}
    >
      {Icon && <Icon className="w-6 h-6 mr-3" />}
      {children}
    </Button>
  );
};