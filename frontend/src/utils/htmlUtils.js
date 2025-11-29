/**
 * Safely extracts text content from HTML string
 * @param {string} html - HTML string to extract text from
 * @param {number} maxLength - Maximum length of extracted text
 * @returns {string} Plain text content
 */
export function extractTextFromHtml(html, maxLength = 200) {
  if (!html) return "";

  // Create a temporary DOM element to parse HTML safely
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Extract text content
  const text = temp.textContent || temp.innerText || "";

  // Truncate if needed
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }

  return text;
}

/**
 * Extracts only the first line/paragraph from HTML content
 * @param {string} html - HTML string to extract text from
 * @param {number} maxLength - Maximum length of extracted text
 * @returns {string} First line of plain text content
 */
export function extractFirstLineFromHtml(html, maxLength = 120) {
  if (!html) return "";

  // Create a temporary DOM element to parse HTML safely
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Try to get the first paragraph or first element with text
  const firstP = temp.querySelector("p");
  const text = firstP
    ? (firstP.textContent || firstP.innerText || "").trim()
    : (temp.textContent || temp.innerText || "").trim();

  // Remove line breaks and multiple spaces
  const cleanText = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");

  // Truncate if needed
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength) + "...";
  }

  return cleanText;
}
