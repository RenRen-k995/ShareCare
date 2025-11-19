import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';

/**
 * CropModal Component
 * Modal for editing cover image with cropping functionality
 * Follows SKPORT design style with cyan accent (#00E0C6)
 */
export default function CropModal({ isOpen, onClose, onConfirm, imageUrl }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Cover</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex items-center justify-center bg-gray-100 rounded-lg p-8 min-h-[400px]">
          {imageUrl ? (
            <div className="relative max-w-full max-h-[500px]">
              <img
                src={imageUrl}
                alt="Cover preview"
                className="max-w-full max-h-[500px] object-contain"
              />
              {/* Cyan border overlay to represent cropping area */}
              <div className="absolute inset-0 border-4 border-[#00E0C6] rounded-lg pointer-events-none" 
                   style={{
                     boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                   }}>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center">
              <p>No image selected</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-[#00E0C6] hover:bg-[#00c4ae] text-white"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
