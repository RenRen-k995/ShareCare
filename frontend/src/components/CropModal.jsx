import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import getCroppedImg from '../utils/cropImage';

/**
 * CropModal Component
 * Modal for editing cover image with functional cropping using react-easy-crop
 * Fixed aspect ratio: 2.5:1 (wide banner style)
 */
export default function CropModal({ isOpen, onClose, onConfirm, imageUrl, onReupload }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      const croppedImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels);
      onConfirm(croppedImageUrl);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  }, [imageUrl, croppedAreaPixels, onConfirm]);

  const handleReupload = () => {
    if (onReupload) {
      onReupload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Cover</DialogTitle>
        </DialogHeader>
        
        {/* Cropper Area */}
        <div className="relative w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden">
          {imageUrl ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={2.5}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              style={{
                containerStyle: {
                  backgroundColor: '#1f2937',
                },
                cropAreaStyle: {
                  border: '2px solid #22d3ee',
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No image selected</p>
            </div>
          )}
        </div>
        
        {/* Zoom Control */}
        <div className="space-y-2 px-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Zoom</label>
            <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
        
        <DialogFooter className="mt-4 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handleReupload}
            className="mr-auto"
          >
            Reupload
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="bg-cyan-400 hover:bg-cyan-500 text-white"
            >
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
