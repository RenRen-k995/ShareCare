import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";
import { formatDistanceToNow } from "../../lib/utils";
import { Avatar } from "../common";

export default function ChatList({
  onSelectChat,
  selectedChatId,
  onChatsUpdate,
}) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, onlineUsers, markChatAsRead } = useSocket();
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (onChatsUpdate) {
      onChatsUpdate(chats);
    }
  }, [chats, onChatsUpdate]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages to update last message
    socket.on("message:receive", ({ message, chatId, unreadCount }) => {
      setChats((prev) =>
        prev.map((chat) => {
          if (chat._id === chatId) {
            // If the chat is currently selected, don't increment unread
            const newUnreadCount =
              chat._id === selectedChatId
                ? 0
                : unreadCount || (chat.unreadCount || 0) + 1;
            return {
              ...chat,
              lastMessage: message,
              unreadCount: newUnreadCount,
              updatedAt: message.createdAt,
            };
          }
          return chat;
        })
      );

      // Re-sort by updatedAt
      setChats((prev) => {
        return [...prev].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
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

    // Listen for unread count being cleared
    socket.on("chat:unread_cleared", ({ chatId }) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      );
    });

    return () => {
      socket.off("message:receive");
      socket.off("chat:updated");
      socket.off("chat:unread_cleared");
    };
  }, [socket, selectedChatId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getUserChats();
      // Sort chats by most recent first
      const sortedChats = (response.chats || []).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      setChats(sortedChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat) => {
    // Mark chat as read immediately when clicked
    markChatAsRead(chat._id);

    // Update local state
    setChats((prev) =>
      prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
    );

    // Call parent handler
    onSelectChat(chat);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-base text-gray-500 font-medium">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Start a chat to connect with others</p>
          </div>
        ) : (
          <div className="py-2">
            {chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const isOnline = otherUser && isUserOnline(otherUser._id);
              const isSelected = chat._id === selectedChatId;

              return (
                <button
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 ${
                    isSelected 
                      ? "bg-emerald-50 border-l-4 border-emerald-500" 
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={otherUser?.avatar}
                      alt={otherUser?.fullName || otherUser?.username}
                      fallback={otherUser?.fullName || otherUser?.username}
                      size="lg"
                      showOnline
                      isOnline={isOnline}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-semibold text-base truncate ${
                          isSelected ? "text-emerald-700" : "text-gray-800"
                        }`}>
                          {otherUser?.fullName ||
                            otherUser?.username ||
                            "Unknown User"}
                        </h3>
                        {chat.lastMessage && (
                          <span className={`text-xs flex-shrink-0 ${
                            chat.unreadCount > 0 ? "text-emerald-600 font-medium" : "text-gray-400"
                          }`}>
                            {formatDistanceToNow(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${
                          chat.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"
                        }`}>
                          {formatLastMessage(chat.lastMessage)}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-emerald-500 text-white text-xs font-semibold rounded-full px-2.5 py-1 min-w-[24px] text-center shadow-sm">
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
