import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";
import { formatDistanceToNow } from "../../lib/utils";

export default function ChatList({ onSelectChat, selectedChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, onlineUsers } = useSocket();
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages to update last message
    socket.on("message:receive", ({ message, chatId }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage: message,
              unreadCount:
                chat._id === selectedChatId ? 0 : (chat.unreadCount || 0) + 1,
              updatedAt: message.createdAt,
            };
          }
          return chat;
        })
      );
    });

    socket.on("chat:updated", ({ chatId, lastMessage, updatedAt }) => {
      setChats((prev) => {
        const updated = prev.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              lastMessage,
              updatedAt,
            };
          }
          return chat;
        });
        // Re-sort by updatedAt
        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    });

    return () => {
      socket.off("message:receive");
      socket.off("chat:updated");
    };
  }, [socket, selectedChatId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getUserChats();
      setChats(response.chats || []);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(
      (p) => p._id !== currentUserId && p.id !== currentUserId
    );
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const formatLastMessage = (message) => {
    if (!message) return "No messages yet";

    if (message.messageType === "file") {
      return `📎 ${message.fileName || "File"}`;
    }
    if (message.messageType === "image") {
      return "🖼️ Image";
    }
    return message.content?.substring(0, 50) || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        ) : (
          <div className="divide-y">
            {chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const isOnline = otherUser && isUserOnline(otherUser._id);
              const isSelected = chat._id === selectedChatId;

              return (
                <button
                  key={chat._id}
                  onClick={() => onSelectChat(chat)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {otherUser?.avatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.fullName || otherUser.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-lg font-semibold text-gray-600">
                            {(otherUser?.fullName ||
                              otherUser?.username ||
                              "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {otherUser?.fullName ||
                            otherUser?.username ||
                            "Unknown User"}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDistanceToNow(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 truncate">
                          {formatLastMessage(chat.lastMessage)}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
