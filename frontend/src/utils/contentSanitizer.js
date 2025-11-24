/**
 * Sanitize and process HTML content for safe display
 * Ensures all image URLs are absolute
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Process HTML content to ensure all image URLs are absolute
 * @param {string} html - HTML content to process
 * @returns {string} Processed HTML with absolute URLs
 */
export function processContentImages(html) {
  if (!html) return "";

  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Find all images
  const images = temp.querySelectorAll("img");

  images.forEach((img) => {
    const src = img.getAttribute("src");

    // If src is relative (starts with /uploads), make it absolute
    if (src && src.startsWith("/uploads")) {
      img.setAttribute("src", `${API_URL}${src}`);
    }
    // If src is already absolute (http:// or https://), leave it as is
  });

  return temp.innerHTML;
}

/**
 * Strip HTML tags and extract plain text (for previews)
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length of text
 * @returns {string} Plain text
 */
export function extractTextFromHtml(html, maxLength = 200) {
  if (!html) return "";

  // Replace closing tags with space to prevent words from sticking together
  let processed = html
    .replace(
      /<\/(p|div|br|li|h1|h2|h3|h4|h5|h6|blockquote|strong|em|u|strike|s|del|span|b|i)>/gi,
      " "
    )
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, ""); // Remove all other HTML tags

  // Decode HTML entities
  const temp = document.createElement("div");
  temp.innerHTML = processed;
  const text = temp.textContent || temp.innerText || "";

  // Clean up multiple spaces and trim
  const cleanedText = text.replace(/\s+/g, " ").trim();

  if (cleanedText.length > maxLength) {
    return cleanedText.substring(0, maxLength) + "...";
  }

  return cleanedText;
}
