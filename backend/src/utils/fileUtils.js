/**
 * File utility functions for ShareCare
 */

/**
 * Check if a file is an image based on its MIME type
 * @param {string} mimetype - The MIME type of the file
 * @returns {boolean} True if the file is an image
 */
export const isImageFile = (mimetype) => {
  return mimetype && mimetype.startsWith("image/");
};

/**
 * Get the appropriate Cloudinary folder for a file upload
 * @param {string} mimetype - The MIME type of the file
 * @param {string} uploadType - The type of upload ('chat' or 'post')
 * @returns {string} The Cloudinary folder path
 */
export const getCloudinaryFolder = (mimetype, uploadType = "chat") => {
  const isImage = isImageFile(mimetype);
  
  if (uploadType === "chat") {
    return isImage ? "sharecare/chat_images" : "sharecare/chat_files";
  }
  
  // Default to post folders
  return isImage ? "sharecare/post_images" : "sharecare/post_files";
};
