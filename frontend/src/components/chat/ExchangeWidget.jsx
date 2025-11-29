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
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

const STATUS_CONFIG = {
  requested: {
    label: "Request Sent",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  scheduled: {
    label: "Meeting Scheduled",
    color: "bg-purple-100 text-purple-800",
    icon: Calendar,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800",
    icon: Package,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  declined: {
    label: "Declined",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
};

export default function ExchangeWidget({
  chatId,
  post,
  onSchedule,
  onRate,
  onExchangeUpdate,
  onRequestExchange,
}) {
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?.id || user?._id;
  const isPostOwner =
    post?.creator?._id === currentUserId || post?.creator === currentUserId;
  const isGiver = exchange?.giver?._id === currentUserId;
  const isReceiver = exchange?.receiver?._id === currentUserId;

  // Determine exchange direction based on who should be requesting
  // If I'm the owner, I can't request my own item - I should wait for requests OR offer it
  // If I'm not the owner, I'm interested and can request
  const canRequest = !isPostOwner;

  const loadExchange = useCallback(async () => {
    try {
      setLoading(true);
      const data = await exchangeService.getExchangeByChat(chatId);
      setExchange(data.exchange);
    } catch (error) {
      console.error("Error loading exchange:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadExchange();
  }, [loadExchange]);

  useEffect(() => {
    if (!socket) return;

    socket.on("exchange:status_changed", ({ exchangeId, status }) => {
      if (exchange && exchangeId === exchange._id) {
        setExchange((prev) => ({ ...prev, status }));
        if (onExchangeUpdate) {
          onExchangeUpdate({ ...exchange, status });
        }
      }
    });

    return () => {
      socket.off("exchange:status_changed");
    };
  }, [socket, exchange, onExchangeUpdate]);

  const handleStatusUpdate = async (status, note) => {
    try {
      await exchangeService.updateStatus(exchange._id, status, note);
      const updatedExchange = { ...exchange, status };
      setExchange(updatedExchange);
      if (onExchangeUpdate) {
        onExchangeUpdate(updatedExchange);
      }
      socket?.emit("exchange:update", {
        exchangeId: exchange._id,
        status,
        note,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!exchange) {
    // Show appropriate message based on role
    if (!canRequest) {
      // Post owner can offer the item to the chat participant
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Offer this item?
                </p>
                <p className="text-xs text-gray-600">
                  You can propose giving this item to them
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (onRequestExchange) {
                  onRequestExchange();
                }
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 shrink-0"
            >
              Offer Item
            </Button>
          </div>
        </div>
      );
    }

    // Non-owner can request the item
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-full">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Interested in this item?
              </p>
              <p className="text-xs text-gray-600">
                Request to coordinate exchange
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              if (onRequestExchange) {
                onRequestExchange();
              }
            }}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            Request
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[exchange.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded-full">
            <StatusIcon className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">Exchange</span>
            <Badge className={`${statusConfig.color} text-xs px-2 py-0.5`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {isGiver ? "Giving" : "Receiving"}
        </p>
      </div>

      {/* Meeting Details */}
      {exchange.meetingDetails && exchange.status !== "cancelled" && (
        <div className="bg-purple-50 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-purple-900">
            <Calendar className="w-3.5 h-3.5" />
            Meeting Scheduled
          </div>
          {exchange.meetingDetails.scheduledTime && (
            <div className="text-xs text-gray-700">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(exchange.meetingDetails.scheduledTime).toLocaleString()}
            </div>
          )}
          {exchange.meetingDetails.location?.address && (
            <div className="text-xs text-gray-700">
              <MapPin className="w-3 h-3 inline mr-1" />
              {exchange.meetingDetails.location.address}
            </div>
          )}
          {exchange.meetingDetails.method && (
            <div className="text-xs text-gray-700 capitalize">
              <Package className="w-3 h-3 inline mr-1" />
              {exchange.meetingDetails.method.replace("_", " ")}
            </div>
          )}
          {exchange.meetingDetails.notes && (
            <div className="text-xs text-gray-600 italic">
              "{exchange.meetingDetails.notes}"
            </div>
          )}
        </div>
      )}

      {/* Actions based on status and role */}
      <div className="space-y-1.5">
        {exchange.status === "requested" && isGiver && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("accepted")}
              className="flex-1 h-8 text-xs"
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate("declined")}
              className="flex-1 h-8 text-xs"
            >
              Decline
            </Button>
          </div>
        )}

        {exchange.status === "requested" && isReceiver && (
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
            <AlertCircle className="w-3.5 h-3.5" />
            Waiting for owner's response...
          </div>
        )}

        {exchange.status === "accepted" && (
          <Button
            size="sm"
            onClick={() => {
              if (onSchedule) onSchedule();
              if (onExchangeUpdate) onExchangeUpdate(exchange);
            }}
            className="w-full h-8 text-xs"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Schedule Meeting
          </Button>
        )}

        {exchange.status === "scheduled" && (
          <Button
            size="sm"
            onClick={() => handleStatusUpdate("in_progress", "Meeting started")}
            className="w-full h-8 text-xs"
          >
            Start Exchange
          </Button>
        )}

        {exchange.status === "in_progress" && (
          <Button
            size="sm"
            onClick={() =>
              handleStatusUpdate("completed", "Exchange successful")
            }
            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Mark Completed
          </Button>
        )}

        {exchange.status === "completed" &&
          !exchange.rating?.[isGiver ? "giverRating" : "receiverRating"] && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onRate) onRate();
                if (onExchangeUpdate) onExchangeUpdate(exchange);
              }}
              className="w-full h-8 text-xs"
            >
              <Star className="w-3.5 h-3.5 mr-1.5" />
              Rate Exchange
            </Button>
          )}

        {["requested", "accepted", "scheduled", "in_progress"].includes(
          exchange.status
        ) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const reason = prompt(
                "Please provide a reason for cancellation:"
              );
              if (reason) {
                exchangeService.cancelExchange(exchange._id, reason);
                setExchange((prev) => ({ ...prev, status: "cancelled" }));
              }
            }}
            className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Compact Timeline */}
      {exchange.statusHistory && exchange.statusHistory.length > 1 && (
        <div className="border-t pt-2">
          <p className="text-xs font-medium text-gray-400 mb-1">Activity</p>
          <div className="space-y-0.5">
            {exchange.statusHistory.slice(-2).map((history, index) => (
              <div
                key={index}
                className="text-xs text-gray-500 flex items-center gap-1.5"
              >
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="capitalize">
                  {history.status.replace("_", " ")}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(history.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
