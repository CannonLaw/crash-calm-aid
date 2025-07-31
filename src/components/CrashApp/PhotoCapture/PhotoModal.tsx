import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhotoData } from './PhotoUtils';

interface PhotoModalProps {
  photo: PhotoData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  photo,
  isOpen,
  onClose
}) => {
  if (!photo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{photo.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex items-center justify-center">
          <img
            src={photo.dataUrl}
            alt={photo.description || photo.type}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
        
        <div className="space-y-2">
          {photo.description && (
            <p className="text-sm text-muted-foreground">{photo.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Captured: {new Date(photo.timestamp).toLocaleString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};