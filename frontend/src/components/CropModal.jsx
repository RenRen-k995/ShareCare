import React, { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "./ui/button";
import { AlertCircle, ZoomIn, ZoomOut, X } from "lucide-react";
import getCroppedImg from "../utils/cropImage";

// Aspect Ratio: 1600 / 786 (~2.03)
const ASPECT_RATIO = 1600 / 786;

// Helper to center the crop and make it full width initially
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function CropModal({
  isOpen,
  onClose,
  onConfirm,
  imageUrl,
  onReupload,
}) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(null);
  const [imgWidth, setImgWidth] = useState(0);
  const imgRef = useRef(null);

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  const onImageLoad = (e) => {
    const { width, height, naturalWidth } = e.currentTarget;
    setImgWidth(width);

    if (naturalWidth < 400) {
      setError("Image is too small. Width must be at least 400px.");
    } else {
      setError(null);
    }

    setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current || error) return;

    try {
      const image = imgRef.current;
      // Calculate scale based on natural size vs displayed size
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedImageUrl = await getCroppedImg(imageUrl, pixelCrop);
      onConfirm(croppedImageUrl);
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  const handleReupload = () => {
    setError(null);
    setZoom(1);
    if (onReupload) {
      onReupload();
    }
  };

  return (
    // 1. Fixed Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 2. Modal Container */}
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent clicking inside closing the modal
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Cover</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full h-[300px] bg-gray-400 flex items-center justify-center px-6">
          {imageUrl ? (
            <div
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.1s",
              }}
              className="w-full h-full flex items-center justify-center"
            >
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT_RATIO}
                className="custom-crop"
                minWidth={imgWidth * 0.5} // Min width constraint
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop me"
                  onLoad={onImageLoad}
                  style={{
                    maxHeight: "280px",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              </ReactCrop>
            </div>
          ) : (
            <div className="text-white">No image selected</div>
          )}

          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg z-50">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Controls & Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          {/* Buttons */}
          <div className="flex justify-end items-center">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReupload}
                className="rounded-full border-gray-300 text-gray-700 px-6"
              >
                Reupload
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!!error}
                className="bg-cyan-400 hover:bg-cyan-500 text-white font-bold rounded-full px-8 disabled:opacity-50"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>

        {/* Custom CSS */}
        <style>{`
          .custom-crop .ReactCrop__crop-selection {
            border: 2px solid #22d3ee;
            box-shadow: none;
            border-image: none !important;
            animation: none !important;
          }
          .custom-crop .ReactCrop__drag-handle {
            width: 10px;
            height: 10px;
            background-color: #22d3ee;
            border: 1px solid #22d3ee;
          }
          .ReactCrop__rule-of-thirds-vt, .ReactCrop__rule-of-thirds-hz {
             display: none; 
          }
        `}</style>
      </div>
    </div>
  );
}
