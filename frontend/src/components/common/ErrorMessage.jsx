import { cn } from "../../lib/utils";

/**
 * Reusable error message component with consistent styling
 * @param {string} message - Error message to display
 * @param {string} className - Additional CSS classes
 */
export default function ErrorMessage({ message, className }) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100",
        className
      )}
    >
      {message}
    </div>
  );
}
