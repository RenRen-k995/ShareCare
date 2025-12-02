import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath, folder = "uploads") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto", // Automatically detect file type (image, video, raw)
      transformation: [
        { quality: "auto:good" }, // Automatic quality optimization
        { fetch_format: "auto" }, // Automatically deliver best format (WebP for supported browsers)
      ],
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    // Clean up local file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} imageUrl - The Cloudinary image URL
 * @returns {string|null} The public_id or null if not a valid Cloudinary URL
 */
export const extractPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  try {
    // Match Cloudinary URL pattern
    // Example: https://res.cloudinary.com/cloud-name/image/upload/v123456/folder/image.jpg
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - The Cloudinary image URL or public_id
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    // Don't throw error to prevent blocking main operations
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} imageUrls - Array of Cloudinary image URLs
 * @returns {Promise<void>}
 */
export const deleteMultipleFromCloudinary = async (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) return;

  try {
    const publicIds = imageUrls
      .map((url) => extractPublicId(url))
      .filter((id) => id !== null);

    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds);
      console.log(`Deleted ${publicIds.length} images from Cloudinary`);
    }
  } catch (error) {
    console.error("Error deleting multiple from Cloudinary:", error);
    // Don't throw error to prevent blocking main operations
  }
};

export default cloudinary;
