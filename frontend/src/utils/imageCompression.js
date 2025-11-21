/**
 * Compress and resize an image file to a specific maximum width while maintaining aspect ratio
 * @param {File|Blob} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} - Base64 data URL of compressed image
 */
export const compressImage = (file, maxWidth = 600, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Compress and resize an image to specific dimensions
 * @param {File|Blob|string} source - The image file or data URL
 * @param {number} targetWidth - Target width in pixels
 * @param {number} targetHeight - Target height in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} - Base64 data URL of compressed image
 */
export const compressToSize = (
  source,
  targetWidth,
  targetHeight,
  quality = 0.85
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processImage = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calculate scaling to cover the target area (like object-fit: cover)
      const scale = Math.max(
        targetWidth / img.width,
        targetHeight / img.height
      );
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (targetWidth - scaledWidth) / 2;
      const offsetY = (targetHeight - scaledHeight) / 2;

      // Draw image centered and scaled
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    if (typeof source === "string") {
      // Source is already a data URL
      img.src = source;
      img.onload = processImage;
      img.onerror = reject;
    } else {
      // Source is a File or Blob
      const reader = new FileReader();
      reader.readAsDataURL(source);
      reader.onload = (event) => {
        img.src = event.target.result;
        img.onload = processImage;
        img.onerror = reject;
      };
      reader.onerror = reject;
    }
  });
};

/**
 * Convert a blob to a data URL
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Data URL
 */
export const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert a data URL to a Blob
 * @param {string} dataUrl - The data URL to convert
 * @returns {Blob} - The blob
 */
export const dataURLToBlob = (dataUrl) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
