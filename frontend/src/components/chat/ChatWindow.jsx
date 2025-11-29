import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";
import exchangeService from "../../services/exchangeService";
import MessageInput from "./MessageInput";
import ExchangeWidget from "./ExchangeWidget";
import ExchangeRequestModal from "./ExchangeRequestModal";
import MeetingScheduler from "./MeetingScheduler";
import RatingModal from "./RatingModal";
import { format } from "../../lib/utils";
import {
  Check,
  CheckCheck,
  FileText,
  Search,
  X,
  ArrowLeft,
  Smile,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function ChatWindow({ chat, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { user } = useAuth();
  const {
    socket,
    joinChat,
    markChatAsRead,
    onlineUsers,
    connectionStatus,
    reconnectAttempt,
    reactToMessage,
  } = useSocket();

  const currentUserId = user?.id || user?._id;
  const API_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  const otherUser = chat?.participants?.find(
    (p) => p._id !== currentUserId && p.id !== currentUserId
  );
  const isOnline = otherUser && onlineUsers.has(otherUser._id || otherUser.id);

  // Check if current user is the post owner (offering) or not (requesting)
  const isPostOwner =
    chat?.post?.creator?._id === currentUserId ||
    chat?.post?.creator === currentUserId;

  const handleCreateExchangeRequest = async (message) => {
    try {
      const data = await exchangeService.createExchange(
        chat._id,
        chat.post._id
      );
      setExchange(data.exchange);
      socket?.emit("exchange:update", {
        exchangeId: data.exchange._id,
        status: "requested",
      });

      // Optionally send the message to chat
      if (message && message.trim()) {
        socket?.emit("send_message", {
          chatId: chat._id,
          content: message,
        });
      }
    } catch (error) {
      console.error("Error creating exchange request:", error);
      throw error;
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!chat?._id) return;
      try {
        if (reset) setLoading(true);
        const response = await chatService.getChatMessages(chat._id, {
          page: pageNum,
          limit: 20,
        });

        const newMessages = response.messages || [];
        if (reset) {
          setMessages(newMessages.reverse());
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        } else {
          setMessages((prev) => [...newMessages.reverse(), ...prev]);
        }

        setHasMore(response.pagination?.page < response.pagination?.pages);
        setPage(pageNum);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    },
    [chat?._id]
  );

  // Load Exchange Data when Chat opens
  useEffect(() => {
    const loadExchangeData = async () => {
      if (chat?._id) {
        try {
          const data = await exchangeService.getExchangeByChat(chat._id);
          setExchange(data.exchange);
        } catch (err) {
          console.error("Failed to load exchange", err);
        }
      }
    };
    loadExchangeData();
  }, [chat?._id]);

  // Join Room & Load Initial Messages
  useEffect(() => {
    if (chat) {
      setMessages([]);
      setPage(1);
      setSearchResults([]);
      setSearchQuery("");
      setShowSearch(false);
      loadMessages(1, true);
      joinChat(chat._id);
      markChatAsRead(chat._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?._id, loadMessages]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({ message, chatId }) => {
      if (chatId === chat._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        markChatAsRead(chatId);
        scrollToBottom();
      }
    };

    const handleDelivered = ({ messageId, deliveredAt }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDelivered: true, deliveredAt } : m
        )
      );
    };

    const handleReadUpdate = ({ messageId, readBy, readAt }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            const readByArray = Array.isArray(m.readBy) ? m.readBy : [];
            if (!readByArray.some((r) => r.user === readBy)) {
              return {
                ...m,
                readBy: [...readByArray, { user: readBy, readAt }],
              };
            }
          }
          return m;
        })
      );
    };

    const handleMessagesRead = ({ chatId }) => {
      if (chatId === chat._id) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender?._id === currentUserId || m.sender === currentUserId) {
              return m;
            }
            return m;
          })
        );
      }
    };

    const handleTyping = ({ chatId, userId, isTyping }) => {
      if (chatId === chat._id && userId !== currentUserId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          isTyping ? newSet.add(userId) : newSet.delete(userId);
          return newSet;
        });
      }
    };

    const handleSearchResults = ({ results, query }) => {
      if (query === searchQuery) {
        setSearchResults(results || []);
      }
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    socket.on("message:receive", handleReceive);
    socket.on("message:sent", handleReceive);
    socket.on("message:delivered", handleDelivered);
    socket.on("message:read:update", handleReadUpdate);
    socket.on("chat:messages_read", handleMessagesRead);
    socket.on("typing:user", handleTyping);
    socket.on("chat:search:results", handleSearchResults);
    socket.on("message:reaction:update", handleReactionUpdate);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("message:sent", handleReceive);
      socket.off("message:delivered", handleDelivered);
      socket.off("message:read:update", handleReadUpdate);
      socket.off("chat:messages_read", handleMessagesRead);
      socket.off("typing:user", handleTyping);
      socket.off("chat:search:results", handleSearchResults);
      socket.off("message:reaction:update", handleReactionUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, chat?._id, currentUserId, searchQuery]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loading) {
      const oldHeight = container.scrollHeight;
      loadMessages(page + 1).then(() => {
        container.scrollTop = container.scrollHeight - oldHeight;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page]);

  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
  };

  const handleReaction = (messageId, emoji) => {
    reactToMessage(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && socket) {
      socket.emit("chat:search", {
        query: searchQuery.trim(),
        chatId: chat._id,
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const getFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  const renderMessage = (message, index) => {
    const senderId = message.sender?._id || message.sender;
    const isMine = senderId?.toString() === currentUserId?.toString();
    const showAvatar =
      !isMine &&
      (index === 0 || messages[index - 1]?.sender?._id !== message.sender?._id);

    return (
      <div
        key={message._id}
        id={`message-${message._id}`}
        className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}
      >
        {showAvatar && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 overflow-hidden rounded-full bg-slate-200">
              {otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  className="object-cover w-full h-full"
                  alt={otherUser?.username}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xs font-bold text-slate-500">
                  {otherUser?.username?.[0]}
                </div>
              )}
            </div>
          </div>
        )}

        {!isMine && !showAvatar && <div className="w-8"></div>}

        <div
          className={`flex flex-col max-w-[70%] ${
            isMine ? "items-end" : "items-start"
          }`}
        >
          <div className="relative overflow-visible group">
            <div
              className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                isMine
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
              }`}
            >
              {/* Image Type */}
              {message.messageType === "image" && (
                <div className="max-w-xs mb-1 overflow-hidden rounded-lg max-h-80">
                  <img
                    src={getFileUrl(message.fileUrl)}
                    alt="Sent image"
                    className="object-contain w-full h-auto max-w-full cursor-pointer max-h-80 hover:opacity-90"
                    onClick={() =>
                      window.open(getFileUrl(message.fileUrl), "_blank")
                    }
                  />
                </div>
              )}

              {/* File Type */}
              {message.messageType === "file" && (
                <a
                  href={getFileUrl(message.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 mb-1 p-2 rounded-lg ${
                    isMine ? "bg-white/20" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div className="p-1.5 bg-white rounded-full text-emerald-500">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {message.fileName || "Document"}
                    </p>
                    <p className="text-xs opacity-80">
                      {(message.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </a>
              )}

              {/* Text Content */}
              {message.content && (
                <p className="leading-relaxed break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>

            {/* Reaction Button */}
            <button
              onClick={() => setShowEmojiPicker(message._id)}
              className={`absolute ${
                isMine ? "left-2" : "right-2"
              } -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50`}
            >
              <Smile size={14} className="text-gray-600" />
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker === message._id && (
              <div
                ref={emojiPickerRef}
                className={`absolute ${
                  isMine ? "left-0" : "right-0"
                } -bottom-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1 z-10`}
              >
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(message._id, emoji)}
                    className="p-1 text-lg rounded hover:bg-gray-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Display Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(
                  message.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(message._id, emoji)}
                    className="bg-gray-100 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 hover:bg-gray-200"
                  >
                    <span>{emoji}</span>
                    <span className="text-gray-600">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp & Status */}
          <div className="flex items-center gap-1 mt-1 mr-1 text-[10px] text-gray-400">
            <span>{format(message.createdAt, "p")}</span>
            {isMine && (
              <>
                {message.readBy?.length > 1 ? (
                  <CheckCheck
                    size={12}
                    className="text-blue-500"
                    title="Read"
                  />
                ) : message.isDelivered ? (
                  <CheckCheck
                    size={12}
                    className="text-gray-400"
                    title="Delivered"
                  />
                ) : (
                  <Check size={12} className="text-gray-400" title="Sent" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!chat)
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a conversation
      </div>
    );

  return (
    <div className="flex flex-col h-full max-h-full bg-[#F5F7F7] overflow-hidden">
      {/* Connection Status Banner */}
      {connectionStatus !== "connected" && (
        <div
          className={`px-4 py-2 text-center text-sm font-medium ${
            connectionStatus === "connecting"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connectionStatus === "connecting"
            ? `Reconnecting${
                reconnectAttempt > 0 ? ` (attempt ${reconnectAttempt})` : ""
              }...`
            : "Connection lost. Messages will be sent when reconnected."}
        </div>
      )}

      {/* Header */}
      <div className="z-10 flex items-center justify-between flex-shrink-0 px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative">
            <div className="w-10 h-10 overflow-hidden border border-white rounded-full shadow-sm bg-slate-200">
              {otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  className="object-cover w-full h-full"
                  alt={otherUser?.username}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full font-bold text-slate-500">
                  {otherUser?.username?.[0]}
                </div>
              )}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              {otherUser?.fullName || otherUser?.username}
            </h3>
            <p className="text-xs text-gray-500">
              {typingUsers.size > 0
                ? "Typing..."
                : isOnline
                ? "Active now"
                : "Offline"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="w-5 h-5 text-gray-400" />
        </Button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1"
            />
            <Button type="submit" size="sm">
              Search
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
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="px-4 py-2 border-b bg-yellow-50">
          <p className="mb-2 text-sm text-gray-600">
            Found {searchResults.length} message
            {searchResults.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-1 overflow-y-auto max-h-32">
            {searchResults.slice(0, 10).map((msg) => (
              <button
                key={msg._id}
                onClick={() => scrollToMessage(msg._id)}
                className="w-full p-2 text-xs text-left bg-white rounded hover:bg-gray-100"
              >
                <span className="font-medium">{msg.sender?.username}: </span>
                <span className="text-gray-600">
                  {msg.content?.substring(0, 50)}...
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 min-h-0 p-4 overflow-y-auto custom-scrollbar"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {/* Only show if this chat is related to a post */}
        {chat?.post && (
          <div className="mb-4">
            <ExchangeWidget
              chatId={chat._id}
              post={chat.post} // Ensure chat object from backend populates 'post'
              exchange={exchange}
              onExchangeUpdate={setExchange}
              onSchedule={() => setShowScheduler(true)}
              onRate={() => setShowRating(true)}
              onRequestExchange={() => setShowRequestModal(true)}
            />
          </div>
        )}

        {loading && (
          <div className="py-4 text-xs text-center text-gray-400">
            Loading history...
          </div>
        )}

        {/* Messages List */}
        <div className="space-y-2">
          {messages.map((msg, i) => renderMessage(msg, i))}
        </div>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 mt-2 ml-10 text-xs italic text-gray-400">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
            Typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <MessageInput chatId={chat._id} onMessageSent={scrollToBottom} />
      </div>

      {/* Modals */}
      {showRequestModal && chat.post && (
        <ExchangeRequestModal
          post={chat.post}
          isOffer={isPostOwner}
          onClose={() => setShowRequestModal(false)}
          onConfirm={handleCreateExchangeRequest}
        />
      )}

      {showScheduler && exchange && (
        <MeetingScheduler
          exchange={exchange}
          onClose={() => setShowScheduler(false)}
          onScheduled={() => {
            setShowScheduler(false);
            // Reload exchange widget
          }}
        />
      )}

      {showRating && exchange && (
        <RatingModal
          exchange={exchange}
          onClose={() => setShowRating(false)}
          onRated={() => {
            setShowRating(false);
            // Reload exchange widget
          }}
        />
      )}
    </div>
  );
}
