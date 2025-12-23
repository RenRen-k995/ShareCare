import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import exchangeService from "../../services/exchangeService";
import {
  Check,
  X,
  Clock,
  MessageCircle,
  CheckCircle2,
  Gift,
  ChevronUp,
  ChevronDown,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "../ui/button";

/**
 * Exchange Widget - Simplified for Donation Platform
 * Displays in chat to manage item exchange workflow
 */

// Status styles
const STATUS_STYLES = {
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  declined: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS = {
  requested: "Pending Approval",
  accepted: "Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

export default function ExchangeWidget({
  post,
  exchange: initialExchange,
  onExchangeUpdate,
  onRequestExchange,
}) {
  const [exchange, setExchange] = useState(initialExchange);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { socket } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?.id || user?._id;

  // ==================== DETERMINE ROLE ====================
  const postAuthorId = post?.author?._id || post?.author;
  const isGiver = currentUserId === postAuthorId?.toString();
  const isReceiver = !isGiver;

  const exchangeGiverId = exchange?.giver?._id || exchange?.giver;

  const isExchangeGiver = exchange
    ? currentUserId === exchangeGiverId?.toString()
    : isGiver;
  // Note: isReceiver is used for request button display condition

  // ==================== EFFECTS ====================

  useEffect(() => {
    setExchange(initialExchange);
  }, [initialExchange]);

  useEffect(() => {
    if (!socket || !exchange) return;

    const handleExchangeUpdate = (data) => {
      if (
        data.exchangeId === exchange._id ||
        data.exchange?._id === exchange._id
      ) {
        const updated = data.exchange || { ...exchange, ...data };
        setExchange(updated);
        if (onExchangeUpdate) onExchangeUpdate(updated);
      }
    };

    socket.on("exchange:status_changed", handleExchangeUpdate);
    socket.on("exchange:updated", handleExchangeUpdate);

    return () => {
      socket.off("exchange:status_changed", handleExchangeUpdate);
      socket.off("exchange:updated", handleExchangeUpdate);
    };
  }, [socket, exchange, onExchangeUpdate]);

  // ==================== HANDLERS ====================

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exchangeService.acceptExchange(exchange._id);
      setExchange(response.exchange);
      if (onExchangeUpdate) onExchangeUpdate(response.exchange);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept request");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await exchangeService.declineExchange(exchange._id);
      setExchange(response.exchange);
      if (onExchangeUpdate) onExchangeUpdate(response.exchange);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to decline request");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Confirm that the item has been successfully exchanged?"))
      return;
    setLoading(true);
    setError(null);
    try {
      const response = await exchangeService.completeExchange(exchange._id);
      setExchange(response.exchange);
      if (onExchangeUpdate) onExchangeUpdate(response.exchange);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete exchange");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this exchange?")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await exchangeService.cancelExchange(
        exchange._id,
        "changed_mind"
      );
      setExchange(response.exchange);
      if (onExchangeUpdate) onExchangeUpdate(response.exchange);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel exchange");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER CONDITIONS ====================

  // No exchange yet - show request button for Receiver
  if (!exchange) {
    if (isReceiver && post?.status === "available") {
      return (
        <WidgetContainer
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">
                  Want this item?
                </p>
                <p className="text-sm text-gray-500">
                  Send a request to the owner
                </p>
              </div>
            </div>
            <Button
              onClick={onRequestExchange}
              className="w-full h-12 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Request This Item
            </Button>
          </div>
        </WidgetContainer>
      );
    }
    return null;
  }

  // Hide widget for terminal states (completed, declined, cancelled)
  if (["declined", "cancelled", "completed"].includes(exchange?.status)) {
    return null;
  }

  // ==================== MAIN RENDER ====================

  return (
    <WidgetContainer isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}>
      <div className="p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full border ${
              STATUS_STYLES[exchange.status]
            }`}
          >
            {STATUS_LABELS[exchange.status]}
          </span>
          <span className="text-xs text-gray-400">
            {isExchangeGiver ? "You are the giver" : "You are the receiver"}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2 mb-3 text-xs text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* STATE: REQUESTED */}
        {exchange.status === "requested" && (
          <RequestedState
            exchange={exchange}
            isGiver={isExchangeGiver}
            loading={loading}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onCancel={handleCancel}
          />
        )}

        {/* STATE: ACCEPTED */}
        {exchange.status === "accepted" && (
          <AcceptedState
            isGiver={isExchangeGiver}
            loading={loading}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
      </div>
    </WidgetContainer>
  );
}

// ==================== SUB COMPONENTS ====================

function WidgetContainer({
  children,
  isCollapsed,
  setIsCollapsed,
  variant = "default",
}) {
  const baseClasses =
    variant === "minimal"
      ? "relative mb-3 border rounded-lg bg-gray-50"
      : "relative mb-3 border rounded-lg shadow-sm bg-white";

  return (
    <div className={baseClasses}>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? "max-h-0" : "max-h-[400px]"
        }`}
      >
        {children}
      </div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-0 z-10 px-3 pt-1 pb-1 transition-all transform -translate-x-1/2 translate-y-1/2 rounded-full shadow-md left-1/2 bg-gray-100 hover:bg-gray-200"
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}

function RequestedState({
  exchange,
  isGiver,
  loading,
  onAccept,
  onDecline,
  onCancel,
}) {
  return (
    <>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-amber-100">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-sm font-semibold text-gray-900">
            {isGiver ? "Someone wants your item!" : "Request sent"}
          </p>
          <p className="text-xs text-gray-600">
            {isGiver
              ? `${
                  exchange.receiver?.username ||
                  exchange.receiver?.fullName ||
                  "Someone"
                } wants to receive this item`
              : "Waiting for the owner to respond"}
          </p>
        </div>
      </div>

      {isGiver ? (
        <div className="flex gap-3">
          <Button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 h-12 text-base font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Accept Request
              </>
            )}
          </Button>
          <Button
            onClick={onDecline}
            disabled={loading}
            variant="outline"
            className="h-12 px-5 text-base font-bold text-red-600 border-2 border-red-300 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="p-3 mb-3 border rounded-xl bg-amber-50 border-amber-200">
            <p className="text-sm text-center text-amber-700">
              💬 Chat with them to introduce yourself and explain why you need
              this item
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cancel request
          </button>
        </>
      )}
    </>
  );
}

function AcceptedState({ isGiver, loading, onComplete, onCancel }) {
  return (
    <>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-blue-100">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-sm font-semibold text-blue-900">
            🎉 Request accepted!
          </p>
          <p className="text-xs text-gray-600">
            Chat to arrange a meeting time and place
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 mb-4 border rounded-xl bg-blue-50 border-blue-200">
        <p className="mb-2 text-sm font-semibold text-blue-800">
          💡 Meeting tips:
        </p>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Meet in a public, safe place</li>
          <li>• Let someone know where you're going</li>
          <li>• Check the item before accepting</li>
        </ul>
      </div>

      {/* Complete Button */}
      <Button
        onClick={onComplete}
        disabled={loading}
        className="w-full h-12 text-base font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Check className="w-5 h-5 mr-2" />
            {isGiver ? "✅ Confirm Item Given" : "✅ Confirm Item Received"}
          </>
        )}
      </Button>

      <button
        onClick={onCancel}
        className="w-full mt-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Cancel exchange
      </button>
    </>
  );
}
