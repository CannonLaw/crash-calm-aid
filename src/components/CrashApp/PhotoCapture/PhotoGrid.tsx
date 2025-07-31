import React from 'react';
import { Camera, FileText, Car, Shield } from 'lucide-react';
import { PhotoCaptureButton } from './PhotoCaptureButton';
import { PhotoData } from './PhotoUtils';

interface PhotoGridProps {
  photos: PhotoData[];
  onPhotoCapture: (photo: PhotoData) => void;
  onPhotoRemove: (photoId: string) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotoCapture,
  onPhotoRemove
}) => {
  const getPhotoByType = (type: PhotoData['type']) => {
    return photos.find(photo => photo.type === type);
  };

  const handlePhotoRemove = (type: PhotoData['type']) => {
    const photo = getPhotoByType(type);
    if (photo) {
      onPhotoRemove(photo.id);
    }
  };

  const photoCategories = [
    {
      type: 'vehicle-damage' as const,
      label: 'Vehicle Damage',
      icon: <Car className="w-6 h-6" />
    },
    {
      type: 'accident-scene' as const,
      label: 'Accident Scene',
      icon: <Camera className="w-6 h-6" />
    },
    {
      type: 'license-insurance' as const,
      label: 'License/Insurance',
      icon: <FileText className="w-6 h-6" />
    },
    {
      type: 'other-vehicle' as const,
      label: 'Other Vehicle',
      icon: <Shield className="w-6 h-6" />
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {photoCategories.map((category) => (
        <PhotoCaptureButton
          key={category.type}
          category={category.type}
          label={category.label}
          icon={category.icon}
          photo={getPhotoByType(category.type)}
          onPhotoCapture={onPhotoCapture}
          onPhotoRemove={() => handlePhotoRemove(category.type)}
        />
      ))}
    </div>
  );
};