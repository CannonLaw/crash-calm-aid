import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PhotoData, convertFileToDataUrl, compressImage, validatePhoto } from './PhotoUtils';
import { useToast } from '@/hooks/use-toast';

interface PhotoCaptureButtonProps {
  category: PhotoData['type'];
  label: string;
  icon?: React.ReactNode;
  photo?: PhotoData;
  onPhotoCapture: (photo: PhotoData) => void;
  onPhotoRemove?: () => void;
  className?: string;
}

export const PhotoCaptureButton: React.FC<PhotoCaptureButtonProps> = ({
  category,
  label,
  icon,
  photo,
  onPhotoCapture,
  onPhotoRemove,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validatePhoto(file);
    if (!validation.isValid) {
      toast({
        title: "Invalid Image",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      const dataUrl = await convertFileToDataUrl(compressedFile);
      
      const newPhoto: PhotoData = {
        id: Date.now().toString(),
        type: category,
        description: '',
        file: compressedFile,
        dataUrl,
        timestamp: new Date().toISOString()
      };

      onPhotoCapture(newPhoto);
      
      toast({
        title: "Photo Captured",
        description: "Your photo has been added successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the photo. Please try again.",
        variant: "destructive"
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (onPhotoRemove) {
      onPhotoRemove();
      toast({
        title: "Photo Removed",
        description: "The photo has been removed."
      });
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {photo ? (
        <div className="relative group">
          <div className="aspect-square rounded-lg overflow-hidden border-2 border-primary bg-background">
            <img
              src={photo.dataUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs font-medium text-primary">{label}</span>
            <div className="text-xs text-muted-foreground">
              {new Date(photo.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleCapture}
          className="aspect-square w-full h-auto flex-col gap-2 p-4 border-2 border-dashed hover:border-primary transition-colors"
        >
          {icon || <Camera className="w-6 h-6" />}
          <span className="text-xs font-medium">{label}</span>
        </Button>
      )}
    </div>
  );
};