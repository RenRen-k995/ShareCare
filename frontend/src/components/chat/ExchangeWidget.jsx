import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import exchangeService from "../../services/exchangeService";
import {
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  Package,
  XCircle,
  Star,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const STATUS_CONFIG = {
  requested: {
    label: "Request Sent",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  },
  scheduled: {
    label: "Meeting Scheduled",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Calendar,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Package,
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-50 text-red-800 border-red-200",
    icon: XCircle,
  },
  declined: {
    label: "Declined",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle,
  },
};

export default function ExchangeWidget({
  chatId,
  post,
  // Allow passing existing exchange data
  exchange: initialExchange,
  onSchedule,
  onRate,
  onExchangeUpdate,
  onRequestExchange,
}) {
  const [exchange, setExchange] = useState(initialExchange);
  const [loading, setLoading] = useState(!initialExchange);
  const { socket } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?.id || user?._id;
  const isPostOwner =
    post?.creator?._id === currentUserId || post?.creator === currentUserId;
  const isGiver = exchange?.giver?._id === currentUserId;
  const isReceiver = exchange?.receiver?._id === currentUserId; // eslint-disable-line no-unused-vars
  const canRequest = !isPostOwner;

  // Update local state if prop changes
  useEffect(() => {
    if (initialExchange) {
      setExchange(initialExchange);
      setLoading(false);
    }
  }, [initialExchange]);

  const loadExchange = useCallback(async () => {
    if (initialExchange) return; // Skip if we have data via props
    try {
      setLoading(true);
      const data = await exchangeService.getExchangeByChat(chatId);
      setExchange(data.exchange);
    } catch (error) {
      console.error("Error loading exchange:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId, initialExchange]);

  useEffect(() => {
    loadExchange();
  }, [loadExchange]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleStatusChange = ({ exchangeId, status }) => {
      if (exchange && exchangeId === exchange._id) {
        const updated = { ...exchange, status };
        setExchange(updated);
        if (onExchangeUpdate) onExchangeUpdate(updated);
      }
    };
    socket.on("exchange:status_changed", handleStatusChange);
    return () => socket.off("exchange:status_changed", handleStatusChange);
  }, [socket, exchange, onExchangeUpdate]);

  const handleStatusUpdate = async (status, note) => {
    try {
      await exchangeService.updateStatus(exchange._id, status, note);
      const updatedExchange = { ...exchange, status };
      setExchange(updatedExchange);
      if (onExchangeUpdate) onExchangeUpdate(updatedExchange);
      socket?.emit("exchange:update", {
        exchangeId: exchange._id,
        status,
        note,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) return null;

  // 1. No Active Exchange
  if (!exchange) {
    if (!canRequest) {
      return (
        <div className="p-3 mb-4 border border-blue-100 bg-blue-50/50 rounded-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Offer Item?</p>
                <p className="text-xs text-gray-500">
                  Propose giving this item.
                </p>
              </div>
            </div>
            <Button
              onClick={onRequestExchange}
              size="sm"
              className="text-xs text-white bg-blue-600 rounded-full hover:bg-blue-700"
            >
              Offer Item
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-3 mb-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-full">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Interested?</p>
              <p className="text-xs text-gray-500">
                Request to coordinate exchange
              </p>
            </div>
          </div>
          <Button
            onClick={onRequestExchange}
            size="sm"
            className="text-xs text-white rounded-full bg-emerald-600 hover:bg-emerald-700"
          >
            Request Item
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[exchange.status] || STATUS_CONFIG.requested;
  const StatusIcon = statusConfig.icon;

  // 2. Active Exchange UI
  return (
    <div className="mb-4 overflow-hidden bg-white border shadow-sm border-slate-100 rounded-2xl">
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b bg-slate-50/50 border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden bg-white border border-gray-100 rounded-lg">
            <img
              src={post.image || post.images?.[0] || "/vite.svg"}
              alt=""
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{post.title}</h3>
            <Badge className={`mt-0.5 font-normal ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] text-gray-400 border-gray-200"
        >
          {isGiver ? "GIVING" : "RECEIVING"}
        </Badge>
      </div>

      <div className="p-3 space-y-3">
        {/* Meeting Details */}
        {exchange.meetingDetails && exchange.status !== "cancelled" && (
          <div className="p-3 space-y-1 border border-purple-100 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <Calendar className="w-3.5 h-3.5" />
              Meeting Details
            </div>
            <div className="text-xs text-purple-700 pl-5.5 space-y-0.5">
              <div>
                {new Date(exchange.meetingDetails.scheduledTime).toLocaleString(
                  [],
                  { dateStyle: "medium", timeStyle: "short" }
                )}
              </div>
              <div className="truncate">
                {exchange.meetingDetails.location?.address}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {exchange.status === "requested" && isGiver && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusUpdate("accepted")}
                className="flex-1 h-8 text-xs text-white rounded-full bg-emerald-500 hover:bg-emerald-600"
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusUpdate("declined")}
                className="flex-1 h-8 text-xs text-red-500 border-red-100 rounded-full hover:bg-red-50"
              >
                Decline
              </Button>
            </>
          )}

          {exchange.status === "accepted" && (
            <Button
              size="sm"
              onClick={onSchedule}
              className="w-full h-8 text-xs text-white bg-purple-500 rounded-full hover:bg-purple-600"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule Meeting
            </Button>
          )}

          {exchange.status === "scheduled" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("in_progress")}
              className="w-full h-8 text-xs text-white bg-blue-500 rounded-full hover:bg-blue-600"
            >
              Confirm Meeting Started
            </Button>
          )}

          {exchange.status === "in_progress" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("completed")}
              className="w-full h-8 text-xs text-white rounded-full bg-emerald-600 hover:bg-emerald-700"
            >
              Mark as Completed
            </Button>
          )}

          {exchange.status === "completed" &&
            !exchange.rating?.[isGiver ? "giverRating" : "receiverRating"] && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRate}
                className="w-full h-8 text-xs text-yellow-600 border-yellow-200 rounded-full hover:bg-yellow-50"
              >
                <Star className="w-3.5 h-3.5 mr-1.5" /> Rate Experience
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
