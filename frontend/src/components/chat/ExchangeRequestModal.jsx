import { useState } from "react";
import { X, Package, Send, Gift } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export default function ExchangeRequestModal({
  post,
  onClose,
  onConfirm,
  isOffer = false,
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(message);
      onClose();
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {isOffer ? (
              <>
                <Gift className="w-5 h-5 text-blue-600" />
                Offer Item to User
              </>
            ) : (
              <>
                <Package className="w-5 h-5 text-emerald-600" />
                Request Item Exchange
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Post Info */}
          <div
            className={`${
              isOffer ? "bg-blue-50" : "bg-gray-50"
            } rounded-lg p-3`}
          >
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isOffer ? "Offering Item:" : "Requesting Item:"}
            </p>
            <p className="text-base font-semibold text-gray-900">
              {post?.title || "Item"}
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="text-sm font-medium text-gray-700"
            >
              Add a message (optional)
            </label>
            <Textarea
              id="message"
              placeholder={
                isOffer
                  ? "Let them know why you'd like to give them this item..."
                  : "Introduce yourself and explain why you need this item..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {isOffer
                ? "A friendly message helps them feel comfortable accepting"
                : "A friendly message can increase your chances of approval"}
            </p>
          </div>

          {/* Info Box */}
          <div
            className={`${
              isOffer
                ? "bg-blue-50 border-blue-200"
                : "bg-emerald-50 border-emerald-200"
            } border rounded-lg p-3`}
          >
            <p className="text-sm text-gray-800">
              {isOffer ? (
                <>
                  📋 The other user will be notified of your offer and can
                  accept or decline. You'll coordinate pickup details once
                  accepted.
                </>
              ) : (
                <>
                  📋 The owner will be notified and can accept or decline your
                  request. You'll be able to coordinate pickup details once
                  accepted.
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${
                isOffer
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              disabled={loading}
            >
              {isOffer ? (
                <Gift className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {loading ? "Sending..." : isOffer ? "Send Offer" : "Send Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
