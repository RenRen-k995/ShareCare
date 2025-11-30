/**
 * Post status configuration
 * Note: 'unavailable' is the backend status, 'donated' is a display alias
 */
export const POST_STATUS = {
  available: {
    value: "available",
    label: "Available",
    badgeClass: "text-emerald-600 border-emerald-200 bg-emerald-50",
    dotClass: "bg-emerald-500 animate-pulse",
  },
  unavailable: {
    value: "unavailable",
    label: "Donated",
    badgeClass: "text-white bg-blue-500 border-blue-500",
    dotClass: "bg-white",
  },
};

/**
 * Get status badge config
 * @param {string} status - Status key
 * @returns {Object} Status configuration
 */
export const getStatusConfig = (status) => {
  return POST_STATUS[status] || POST_STATUS.available;
};
