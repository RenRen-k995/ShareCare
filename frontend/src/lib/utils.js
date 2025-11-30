import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date relative to now (e.g., "Just now", "5m ago", "2h ago", "3d ago")
 * Short format suitable for lists and compact displays
 */
export function formatDistanceToNow(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return past.toLocaleDateString();
}

/**
 * Format date relative to now with more detail (e.g., "Just now", "5 minutes ago", "2 hours ago")
 * Longer format with full words
 */
export function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 2592000) {
    return past.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function format(date, formatStr) {
  const d = new Date(date);

  if (formatStr === "p") {
    // Time only
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (formatStr === "PP") {
    // Date only
    return d.toLocaleDateString();
  }

  return d.toLocaleString();
}
