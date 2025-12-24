import { useState, useEffect } from "react";
import { ExternalLink, Globe, Loader2 } from "lucide-react";
import { extractUrls, URL_REGEX } from "../../utils/urlUtils";

/**
 * Link Preview Component
 * Fetches and displays preview for URLs in messages
 */
export default function LinkPreview({ url, className = "" }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!url) return;

      setLoading(true);
      setError(false);

      try {
        // Use a link preview API or scrape metadata
        // For demo, we'll parse basic info from the URL
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace("www.", "");

        // Try to fetch Open Graph data via a proxy or API
        // For now, we'll use basic URL info
        const previewData = {
          url,
          domain,
          title: domain,
          description: null,
          image: null,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        };

        // Try fetching via proxy API (you can implement this on your backend)
        try {
          const API_URL =
            import.meta.env.VITE_API_URL || "http://localhost:5000";
          const response = await fetch(
            `${API_URL}/api/link-preview?url=${encodeURIComponent(url)}`,
            { timeout: 5000 }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.title) previewData.title = data.title;
            if (data.description) previewData.description = data.description;
            if (data.image) previewData.image = data.image;
            if (data.favicon) previewData.favicon = data.favicon;
          }
        } catch {
          // Fallback to basic preview if API fails
          console.log("Link preview API not available, using basic preview");
        }

        setPreview(previewData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (error || !url) return null;

  if (loading) {
    return (
      <div
        className={`flex items-center gap-2 p-3 mt-2 bg-gray-100 rounded-xl ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading preview...</span>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block mt-2 overflow-hidden border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors ${className}`}
    >
      {/* Image Preview */}
      {preview.image && (
        <div className="w-full h-32 overflow-hidden bg-gray-100">
          <img
            src={preview.image}
            alt={preview.title}
            className="object-cover w-full h-full"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {preview.favicon ? (
            <img
              src={preview.favicon}
              alt=""
              className="w-4 h-4 rounded"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Globe className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-xs text-gray-500">{preview.domain}</span>
          <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
        </div>

        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
          {preview.title}
        </h4>

        {preview.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}

/**
 * Renders text with clickable links
 */
export function TextWithLinks({ text, className = "" }) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);
  const urls = extractUrls(text);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urls.includes(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
