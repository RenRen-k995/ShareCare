import { cn } from "../../lib/utils";
import LoadingSpinner from "../LoadingSpinner";

/**
 * Reusable page loading state component
 * @param {string} message - Loading message to display
 * @param {string} className - Additional CSS classes
 */
export default function PageLoadingState({ message = "Loading...", className }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-64",
        className
      )}
    >
      <LoadingSpinner message={message} />
    </div>
  );
}
