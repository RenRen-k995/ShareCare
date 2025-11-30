/**
 * API base URL configuration
 * Centralized API URL handling to avoid repetition
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Get full URL for an image path
 * @param {string} path - Image path (can be full URL or relative path)
 * @returns {string} Full image URL
 */
export const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
};

/**
 * Get full URL for a file path
 * @param {string} path - File path (can be full URL or relative path)
 * @returns {string} Full file URL
 */
export const getFileUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Remove /api if present in base URL for file paths
  const baseUrl = API_BASE_URL.replace("/api", "");
  return `${baseUrl}${path}`;
};
