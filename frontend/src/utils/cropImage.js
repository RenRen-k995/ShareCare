/**
 * Creates an image element from a URL
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Get radians from degrees
 * @param {number} degreeValue - Degrees
 * @returns {number} Radians
 */
function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Gets the cropped image from a source image using Canvas API
 * @param {string} imageSrc - Source image URL
 * @param {Object} pixelCrop - Crop area in pixels {x, y, width, height}
 * @param {number} rotation - Rotation in degrees (default: 0)
 * @param {boolean} flip - Whether to flip horizontally (default: {horizontal: false, vertical: false})
 * @param {number} maxWidth - Maximum width for the output image (default: 1600 for cover images)
 * @returns {Promise<string>} - Returns the cropped image as a blob URL
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  maxWidth = 1600
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Get the data from the rotated canvas
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Calculate scaled dimensions (maintain aspect ratio)
  let finalWidth = pixelCrop.width;
  let finalHeight = pixelCrop.height;

  if (finalWidth > maxWidth) {
    const scale = maxWidth / finalWidth;
    finalWidth = maxWidth;
    finalHeight = Math.round(pixelCrop.height * scale);
  }

  // Set canvas to cropped size first
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste cropped image data
  ctx.putImageData(data, 0, 0);

  // If we need to scale down, create a new canvas
  if (finalWidth !== pixelCrop.width) {
    const scaledCanvas = document.createElement("canvas");
    const scaledCtx = scaledCanvas.getContext("2d");

    scaledCanvas.width = finalWidth;
    scaledCanvas.height = finalHeight;

    // Use high-quality image smoothing
    scaledCtx.imageSmoothingEnabled = true;
    scaledCtx.imageSmoothingQuality = "high";

    // Draw scaled image
    scaledCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);

    // Return as blob URL from scaled canvas
    return new Promise((resolve, reject) => {
      scaledCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          const fileUrl = URL.createObjectURL(blob);
          resolve(fileUrl);
        },
        "image/jpeg",
        0.9
      ); // 0.9 quality for good balance
    });
  }

  // Return as blob URL from original canvas if no scaling needed
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const fileUrl = URL.createObjectURL(blob);
        resolve(fileUrl);
      },
      "image/jpeg",
      0.9
    ); // 0.9 quality for good balance
  });
}
