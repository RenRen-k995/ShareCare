// URL regex pattern to detect links in messages
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Extract URLs from text content
 */
export const extractUrls = (text) => {
  if (!text) return [];
  const matches = text.match(URL_REGEX);
  return matches || [];
};

/**
 * Check if text contains any URLs
 */
export const hasUrls = (text) => {
  return URL_REGEX.test(text);
};

export { URL_REGEX };
