import { cn } from "../../lib/utils";

/**
 * Reusable empty state component for lists
 * @param {string} icon - Optional icon component
 * @param {string} title - Title text
 * @param {string} description - Description text
 * @param {React.ReactNode} action - Optional action button/link
 * @param {string} className - Additional CSS classes
 */
export default function EmptyState({
  icon,
  title = "No items found",
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 bg-white rounded-2xl shadow-sm",
        className
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-100">
          {icon}
        </div>
      )}
      <p className="mb-2 text-lg font-medium text-gray-600">{title}</p>
      {description && (
        <p className="mb-4 text-sm text-gray-400">{description}</p>
      )}
      {action}
    </div>
  );
}
