/**
 * Safely extracts text content from HTML string
 * @param {string} html - HTML string to extract text from
 * @param {number} maxLength - Maximum length of extracted text
 * @returns {string} Plain text content
 */
export function extractTextFromHtml(html, maxLength = 200) {
  if (!html) return '';
  
  // Create a temporary DOM element to parse HTML safely
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Extract text content
  const text = temp.textContent || temp.innerText || '';
  
  // Truncate if needed
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  
  return text;
}
