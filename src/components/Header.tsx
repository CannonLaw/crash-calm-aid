import { Link } from "react-router-dom";
import logo from "@/assets/crash-genius-logo.png";

interface HeaderProps {
  onHomeClick?: () => void;
}

export const Header = ({ onHomeClick }: HeaderProps) => {
  const handleLogoClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
  };

  return (
    <header className="w-full bg-background border-b border-border py-4">
      <div className="container mx-auto px-4 flex justify-center">
        <button
          onClick={handleLogoClick}
          className="hover:opacity-80 transition-opacity"
          aria-label="Return to home page"
        >
          <img 
            src={`${logo}?v=${Date.now()}`}
            alt="Crash Genius Logo" 
            className="h-16 w-auto"
          />
        </button>
      </div>
    </header>
  );
};