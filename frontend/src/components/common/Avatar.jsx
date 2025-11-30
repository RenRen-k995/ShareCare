import { cn } from "../../lib/utils";

/**
 * Reusable avatar component with consistent styling
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} fallback - Fallback text (usually first letter of name)
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {boolean} showOnline - Whether to show online indicator
 * @param {boolean} isOnline - Whether user is online
 * @param {string} className - Additional CSS classes
 */
export default function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  showOnline = false,
  isOnline = false,
  className,
}) {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-2xl",
    "3xl": "w-32 h-32 text-4xl",
  };

  const onlineIndicatorSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-3.5 h-3.5",
    "2xl": "w-4 h-4",
    "3xl": "w-5 h-5",
  };

  const getFallbackLetter = () => {
    if (fallback) return fallback.charAt(0).toUpperCase();
    if (alt) return alt.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-slate-100 border border-slate-50",
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full font-bold text-white bg-gradient-to-br from-blue-400 to-indigo-500">
            {getFallbackLetter()}
          </div>
        )}
      </div>
      {showOnline && isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white",
            onlineIndicatorSizes[size]
          )}
        />
      )}
    </div>
  );
}
