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
  Package,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "../ui/button";

export default function ExchangeWidget({
  post,
  exchange: initialExchange,
  onExchangeUpdate,
  onRequestExchange,
}) {
  const [exchange, setExchange] = useState(initialExchange);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?.id || user?._id;

  // Determine role from exchange data
  const isGiver = exchange
    ? exchange.giver?._id === currentUserId || exchange.giver === currentUserId
    : post?.author?._id === currentUserId || post?.author === currentUserId;
  const isReceiver = !isGiver;

  // Update local state if prop changes
  useEffect(() => {
    setExchange(initialExchange);
  }, [initialExchange]);

  // Socket listener for real-time updates
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

        // Auto-dismiss on completion after 3 seconds
        if (updated.status === "completed") {
          setTimeout(() => {
            if (onExchangeUpdate) onExchangeUpdate(null);
          }, 3000);
        }
      }
    };

    socket.on("exchange:status_changed", handleExchangeUpdate);
    socket.on("exchange:updated", handleExchangeUpdate);

    return () => {
      socket.off("exchange:status_changed", handleExchangeUpdate);
      socket.off("exchange:updated", handleExchangeUpdate);
    };
  }, [socket, exchange, onExchangeUpdate]);

  const handleStatusUpdate = async (status) => {
    try {
      const response = await exchangeService.updateStatus(exchange._id, status);
      const updated = response.exchange;
      setExchange(updated);
      if (onExchangeUpdate) onExchangeUpdate(updated);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  // --- RENDER STATES ---

  // No exchange yet - show request button for receiver
  if (!exchange) {
    if (isReceiver && post.status === "available") {
      return (
        <div className="relative mb-3 border-blue-200 rounded-lg bg-blue-50">
          {/* Content with slide animation */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed ? "max-h-0" : "max-h-96"
            }`}
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Request this item
                  </p>
                  <p className="text-xs text-blue-600">
                    Send a message to the owner
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={onRequestExchange}
                className="px-4 text-xs font-semibold text-white bg-blue-600 rounded-lg h-9 hover:bg-blue-700"
              >
                Send Request
              </Button>
            </div>
          </div>

          {/* Peeler Toggle Button at Bottom Center */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute bottom-0 z-10 px-3 py-1 transition-all transform -translate-x-1/2 translate-y-1/2 bg-blue-600 rounded-full shadow-lg left-1/2 hover:bg-blue-700"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-white" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      );
    }
    return null;
  }

  // Auto-dismiss declined/cancelled/completed exchanges
  if (["declined", "cancelled", "completed"].includes(exchange?.status)) {
    return null;
  }

  // --- ACTIVE EXCHANGE STATES ---
  return (
    <div className="relative mt-0 mb-3 border bg-gray-50">
      {/* Content Area with slide animation */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? "max-h-0" : "max-h-[500px]"
        }`}
      >
        <div className="p-4">
          {/* STATE 1: PENDING - Awaiting Giver's Response */}
          {exchange.status === "requested" && (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-amber-100">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-semibold text-gray-900">
                    {isGiver ? "New request received" : "Request sent"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {isGiver
                      ? `${
                          exchange.receiver?.username || "Someone"
                        } wants this item`
                      : "Waiting for the owner to respond"}
                  </p>
                </div>
              </div>

              {isGiver && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleStatusUpdate("accepted")}
                    className="flex-1 h-10 text-sm font-semibold text-white rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept Request
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("declined")}
                    variant="outline"
                    className="h-10 px-4 text-sm font-semibold text-red-600 border border-red-400 rounded-lg hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {isReceiver && (
                <div className="px-3 py-2 border rounded-lg bg-amber-50 border-amber-200">
                  <p className="text-xs text-center text-amber-700">
                    💬 Coordinate pickup details in the chat below
                  </p>
                </div>
              )}
            </>
          )}

          {/* STATE 2: ACCEPTED - Coordinate via Chat */}
          {exchange.status === "accepted" && (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-semibold text-emerald-900">
                    Request accepted!
                  </p>
                  <p className="text-xs text-gray-600">
                    Coordinate pickup time and location in the chat
                  </p>
                </div>
              </div>

              <div className="p-3 mb-3 border rounded-lg bg-emerald-50 border-emerald-200">
                <div className="flex items-start gap-2 text-xs text-emerald-800">
                  <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-semibold">Next steps:</span> Use the
                    chat to agree on when and where to meet for the exchange.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => handleStatusUpdate("completed")}
                className="w-full h-10 text-sm font-semibold text-white rounded-lg shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Package className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>

              <p className="mt-2 text-xs text-center text-gray-500">
                Click after you've successfully exchanged the item
              </p>
            </>
          )}
        </div>
      </div>

      {/* Peeler Toggle Button at Bottom Center */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-0 z-10 px-3 pt-3 transition-all transform -translate-x-1/2 translate-y-1/2 rounded-full shadow-lg left-1/2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-200 hover:to-gray-300"
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
}
