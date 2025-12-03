/**
 * Post category configuration
 * Used for consistent category styling and labeling across the app
 */
export const CATEGORIES = {
  general: {
    value: "general",
    label: "General",
    description: "General posts",
  },
  items: {
    value: "items",
    label: "Items (Donation)",
    shortLabel: "Item",
    description: "Items available for donation",
  },
  knowledge: {
    value: "knowledge",
    label: "Knowledge",
    description: "Knowledge sharing",
  },
  "emotional-support": {
    value: "emotional-support",
    label: "Emotional Support",
    description: "Emotional support posts",
  },
};

/**
 * Category style classes for badges and tags
 */
export const CATEGORY_STYLES = {
  items: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  knowledge: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  "emotional-support": "bg-purple-100 text-purple-700 hover:bg-purple-200",
  general: "bg-gray-100 text-gray-700 hover:bg-gray-200",
};

/**
 * Get category style classes
 * @param {string} category - Category key
 * @returns {string} Tailwind classes for the category
 */
export const getCategoryStyles = (category) => {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
};

/**
 * Get category label for display
 * @param {string} category - Category key
 * @param {boolean} short - Use short label if available
 * @returns {string} Display label
 */
export const getCategoryLabel = (category, short = false) => {
  const config = CATEGORIES[category];
  if (!config) return category;
  return short && config.shortLabel ? config.shortLabel : config.label;
};

/**
 * Category options for select dropdowns
 */
export const CATEGORY_OPTIONS = Object.values(CATEGORIES).map((cat) => ({
  value: cat.value,
  label: cat.label,
}));
