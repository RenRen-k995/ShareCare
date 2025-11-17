import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";
import MessageInput from "./MessageInput";
import { format } from "../../lib/utils";
import {
  Check,
  CheckCheck,
  Download,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function ChatWindow({ chat, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  const { socket, joinChat, markMessageAsRead, onlineUsers } = useSocket();

  const otherUser = chat?.participants?.find(
    (p) => p._id !== currentUserId && p.id !== currentUserId
  );
  const isOnline = otherUser && onlineUsers.has(otherUser._id || otherUser.id);

  useEffect(() => {
    if (chat) {
      loadMessages();
      joinChat(chat._id);
    }
  }, [chat?._id]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on("message:receive", ({ message, chatId }) => {
      if (chatId === chat._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });

        // Mark as read automatically
        setTimeout(() => {
          markMessageAsRead(message._id, chatId);
        }, 500);

        scrollToBottom();
      }
    });

    // Listen for sent message confirmation
    socket.on("message:sent", ({ message, chatId }) => {
      if (chatId === chat._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    // Listen for delivery confirmations
    socket.on("message:delivered", ({ messageId, deliveredAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, isDelivered: true, deliveredAt }
            : msg
        )
      );
    });

    // Listen for read receipts
    socket.on("message:read:update", ({ messageId, readBy, readAt }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            const readByArray = msg.readBy || [];
            if (!readByArray.some((r) => r.user === readBy)) {
              return {
                ...msg,
                readBy: [...readByArray, { user: readBy, readAt }],
              };
            }
          }
          return msg;
        })
      );
    });

    // Listen for reactions
    socket.on("message:reaction:update", ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
      );
    });

    // Listen for typing indicators
    socket.on("typing:user", ({ chatId, userId, isTyping }) => {
      if (chatId === chat._id && userId !== currentUserId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      }
    });

    // Listen for search results
    socket.on("chat:search:results", ({ chatId, results }) => {
      if (chatId === chat._id) {
        setSearchResults(results || []);
      }
    });

    return () => {
      socket.off("message:receive");
      socket.off("message:sent");
      socket.off("message:delivered");
      socket.off("message:read:update");
      socket.off("message:reaction:update");
      socket.off("typing:user");
      socket.off("chat:search:results");
    };
  }, [socket, chat?._id, currentUserId]);

  const loadMessages = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await chatService.getChatMessages(chat._id, {
        page: pageNum,
        limit: 50,
      });

      if (pageNum === 1) {
        setMessages(response.messages || []);
        scrollToBottom();
      } else {
        setMessages((prev) => [...(response.messages || []), ...prev]);
      }

      setHasMore(response.pagination?.page < response.pagination?.pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      const oldHeight = container.scrollHeight;
      loadMessages(page + 1).then(() => {
        // Maintain scroll position
        container.scrollTop = container.scrollHeight - oldHeight;
      });
    }
  }, [hasMore, loading, page]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !socket) return;

    socket.emit("chat:search", {
      chatId: chat._id,
      query: searchQuery,
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const renderMessage = (message, index) => {
    const senderId = message.sender?._id || message.sender;
    const isMine = senderId?.toString() === currentUserId?.toString();
    const showAvatar =
      index === 0 || messages[index - 1]?.sender?._id !== message.sender?._id;
    const isRead = message.readBy?.length > 0;

    return (
      <div
        id={`msg-${message._id}`}
        key={message._id}
        className={`flex gap-2 mb-4 ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isMine && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold">
                {(otherUser?.username || "?")[0].toUpperCase()}
              </div>
            )}
          </div>
        )}

        {!isMine && !showAvatar && <div className="w-8" />}

        <div
          className={`flex flex-col max-w-[70%] ${
            isMine ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`rounded-lg px-4 py-2 ${
              isMine ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
            }`}
          >
            {message.messageType === "file" && (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Download size={16} />
                <span className="text-sm">{message.fileName}</span>
                {message.fileSize && (
                  <span className="text-xs opacity-75">
                    ({(message.fileSize / 1024).toFixed(1)} KB)
                  </span>
                )}
              </a>
            )}

            {message.messageType === "image" && (
              <div>
                <img
                  src={message.fileUrl}
                  alt={message.fileName}
                  className="max-w-full rounded cursor-pointer hover:opacity-90"
                  onClick={() => window.open(message.fileUrl, "_blank")}
                />
                {message.content && (
                  <p className="mt-2 text-sm">{message.content}</p>
                )}
              </div>
            )}

            {message.messageType === "text" && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {message.reactions.map((reaction, idx) => (
                  <span key={idx} className="text-xs bg-white/20 rounded px-1">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <span>{format(message.createdAt, "p")}</span>
            {isMine && (
              <>
                {isRead ? (
                  <CheckCheck size={14} className="text-blue-500" />
                ) : message.isDelivered ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="lg:hidden">
            ←
          </button>

          <div className="relative">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={otherUser.fullName || otherUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="font-semibold">
                  {(otherUser?.username || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold">
              {otherUser?.fullName || otherUser?.username || "Unknown User"}
            </h3>
            <p className="text-sm text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" variant="default">
              <Search className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearSearch}
            >
              <X className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold mb-2">
              Found {searchResults.length} result(s)
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {searchResults.map((msg) => (
                <div
                  key={msg._id}
                  className="text-sm p-2 bg-white rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // Scroll to message (simplified)
                    const element = document.getElementById(`msg-${msg._id}`);
                    element?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  <span className="text-gray-600">
                    {format(msg.createdAt, "p")}:
                  </span>{" "}
                  {msg.content.substring(0, 50)}
                  {msg.content.length > 50 ? "..." : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {loading && page === 1 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center mb-4">
                <button
                  onClick={() => loadMessages(page + 1)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Load more messages
                </button>
              </div>
            )}

            {messages.map((message, index) => renderMessage(message, index))}

            {typingUsers.size > 0 && (
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
                <span>{otherUser?.username} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput chatId={chat._id} onMessageSent={scrollToBottom} />
    </div>
  );
}
