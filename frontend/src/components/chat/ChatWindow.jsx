import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { chatService } from "../../services/chatService";
import exchangeService from "../../services/exchangeService";
import MessageInput from "./MessageInput";
import ExchangeWidget from "./ExchangeWidget";
import ExchangeRequestModal from "./ExchangeRequestModal";
import LinkPreview, { TextWithLinks } from "./LinkPreview";
import { extractUrls } from "../../utils/urlUtils";
import { Avatar } from "../common";
import { getFileUrl } from "../../constants";
import { format } from "../../lib/utils";
import {
  Check,
  CheckCheck,
  FileText,
  Search,
  X,
  ArrowLeft,
  Smile,
  Trash2,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Helper function to highlight search terms in text
const highlightSearchTerm = (text, term) => {
  if (!term || !text) return text;
  const regex = new RegExp(`(${term})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="px-0.5 bg-yellow-300 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

export default function ChatWindow({ chat, onBack }) {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [isExchangeDismissed, setIsExchangeDismissed] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messageMenuRef = useRef(null);

  const { user } = useAuth();
  const {
    socket,
    joinChat,
    markChatAsRead,
    onlineUsers,
    connectionStatus,
    reconnectAttempt,
    reactToMessage,
    deleteMessage,
  } = useSocket();

  const currentUserId = user?.id || user?._id;

  const otherUser = chat?.participants?.find(
    (p) => p._id !== currentUserId && p.id !== currentUserId
  );
  const isOnline = otherUser && onlineUsers.has(otherUser._id || otherUser.id);

  const handleCreateExchangeRequest = async (message) => {
    if (!chat) return;

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
        console.log(
          `Loading messages for chat ${chat._id}, page ${pageNum}...`
        );
        const response = await chatService.getChatMessages(chat._id, {
          page: pageNum,
          limit: 20,
        });

        const newMessages = response.messages || [];
        console.log(`Loaded ${newMessages.length} messages:`, newMessages);
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

  // Reload messages when refresh parameter changes (from new exchange request)
  useEffect(() => {
    const refreshParam = searchParams.get("refresh");
    if (refreshParam && chat?._id) {
      // Reload both messages AND exchange data when refresh parameter is present
      const timer = setTimeout(() => {
        console.log(
          "Refreshing messages due to refresh parameter (after 1s delay)..."
        );
        loadMessages(1, true);

        // Also reload exchange data to get the newly created exchange
        exchangeService
          .getExchangeByChat(chat._id)
          .then((data) => {
            console.log("Reloaded exchange data:", data.exchange);
            setExchange(data.exchange);
          })
          .catch((err) => console.error("Failed to reload exchange", err));
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("refresh"), chat?._id]);

  // Reset dismissal when chat changes
  useEffect(() => {
    setIsExchangeDismissed(false);
  }, [chat?._id]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket || !chat) return;

    const handleReceive = ({ message, chatId }) => {
      if (chatId === chat._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        markChatAsRead(chatId);
        // Auto-scroll to bottom when receiving new message
        setTimeout(() => scrollToBottom(), 100);
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

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, deletedAt: new Date() }
            : m
        )
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
    socket.on("message:deleted", handleMessageDeleted);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("message:sent", handleReceive);
      socket.off("message:delivered", handleDelivered);
      socket.off("message:read:update", handleReadUpdate);
      socket.off("chat:messages_read", handleMessagesRead);
      socket.off("typing:user", handleTyping);
      socket.off("chat:search:results", handleSearchResults);
      socket.off("message:reaction:update", handleReactionUpdate);
      socket.off("message:deleted", handleMessageDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, chat?._id, currentUserId, searchQuery]);

  // Close emoji picker and message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(null);
      }
      if (
        messageMenuRef.current &&
        !messageMenuRef.current.contains(event.target)
      ) {
        setShowMessageMenu(null);
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
    setHighlightedMessageId(messageId);
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Clear highlight after animation
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }
  };

  const handleReaction = (messageId, emoji) => {
    reactToMessage(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessage(messageId);
      setShowMessageMenu(null);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2 || !chat) return;

    setSearchLoading(true);
    try {
      const result = await chatService.searchMessages(
        chat._id,
        searchQuery.trim()
      );
      setSearchResults(result.messages || []);
      setCurrentSearchIndex(0);

      // Auto-jump to first result
      if (result.messages?.length > 0) {
        scrollToMessage(result.messages[0]._id);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
    setCurrentSearchIndex(0);
    setHighlightedMessageId(null);
  };

  const navigateSearchResult = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex =
        (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex]._id);
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
        className={`flex gap-2 transition-all duration-500 ${
          isMine ? "justify-end" : "justify-start"
        } ${
          highlightedMessageId === message._id
            ? "bg-yellow-100 -mx-2 px-2 py-1 rounded-lg ring-2 ring-yellow-400"
            : ""
        }`}
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
          className={`flex flex-col max-w-[60%] ${
            isMine ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`relative flex items-center gap-2 overflow-visible group ${
              !isMine ? "flex-row-reverse" : ""
            }`}
          >
            {/* Action Buttons - Only show for non-deleted messages */}
            {!message.isDeleted && (
              <div className="flex gap-1">
                {/* Reaction Button with Emoji Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(message._id)}
                    className="flex-shrink-0 transition-opacity bg-white border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 p-1.5 shadow-sm hover:bg-gray-50"
                  >
                    <Smile size={18} className="text-gray-600" />
                  </button>

                  {/* Emoji Picker - Above reaction button */}
                  {showEmojiPicker === message._id && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute z-50 flex gap-1 p-2 mb-2 -translate-x-1/2 bg-white border border-gray-200 shadow-lg bottom-full left-1/2 rounded-xl"
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message._id, emoji)}
                          className="p-2 text-xl transition-transform rounded-lg hover:bg-gray-100 hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete Button - Only for own messages */}
                {isMine && (
                  <button
                    onClick={() => setShowMessageMenu(message._id)}
                    className="flex-shrink-0 transition-opacity bg-white border border-gray-200 rounded-full opacity-0 group-hover:opacity-100 p-1.5 shadow-sm hover:bg-red-50"
                  >
                    <MoreVertical size={14} className="text-gray-600" />
                  </button>
                )}
              </div>
            )}

            <div className="relative flex-1">
              {/* Message Menu - Delete option */}
              {showMessageMenu === message._id && isMine && (
                <div
                  ref={messageMenuRef}
                  className={`absolute ${
                    isMine ? "left-0" : "right-0"
                  } bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 px-1 z-50 min-w-[120px]`}
                >
                  <button
                    onClick={() => handleDeleteMessage(message._id)}
                    className="flex items-center w-full gap-2 px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              )}

              {/* Deleted Message State */}
              {message.isDeleted ? (
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow-sm italic ${
                    isMine
                      ? "bg-gray-200 text-gray-500"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  <p className="flex items-center gap-2">
                    <Trash2 size={12} />
                    This message was deleted
                  </p>
                </div>
              ) : (
                <>
                  {/* Image Type - No bubble wrapper */}
                  {message.messageType === "image" && (
                    <div className="max-w-xs overflow-hidden shadow-sm rounded-2xl">
                      <img
                        src={getFileUrl(message.fileUrl)}
                        alt="Sent image"
                        className="object-cover w-full h-auto transition-opacity cursor-pointer max-h-80 hover:opacity-90"
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
                      className={`flex items-center gap-3 p-3 rounded-2xl text-base shadow-sm ${
                        isMine
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white rounded-br-sm"
                          : "bg-white border border-gray-100 hover:bg-gray-50 rounded-bl-sm"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          isMine ? "bg-white/20" : "bg-emerald-100"
                        }`}
                      >
                        <FileText
                          size={18}
                          className={isMine ? "text-white" : "text-emerald-600"}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {message.fileName || "Document"}
                        </p>
                        <p className="text-sm opacity-80">
                          {(message.fileSize / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </a>
                  )}

                  {/* Text messages with bubble */}
                  {message.messageType !== "image" &&
                    message.messageType !== "file" && (
                      <div>
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                            isMine
                              ? "bg-emerald-500 text-white rounded-br-sm"
                              : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                          }`}
                        >
                          {/* Text Content with clickable links */}
                          {message.content && (
                            <p className="text-base leading-relaxed break-words whitespace-pre-wrap">
                              <TextWithLinks
                                text={message.content}
                                className={
                                  isMine
                                    ? "text-white [&_a]:text-blue-200 [&_a]:hover:text-white"
                                    : ""
                                }
                              />
                            </p>
                          )}
                        </div>

                        {/* Link Preview - Only for received messages to avoid clutter */}
                        {!isMine &&
                          message.content &&
                          extractUrls(message.content).length > 0 && (
                            <div className="mt-1 max-w-xs">
                              <LinkPreview
                                url={extractUrls(message.content)[0]}
                              />
                            </div>
                          )}
                      </div>
                    )}

                  {/* Display Reactions - Below message */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1 ${
                        isMine ? "justify-start" : "justify-end"
                      }`}
                    >
                      {Object.entries(
                        message.reactions.reduce((acc, r) => {
                          const key = r.emoji;
                          if (!acc[key]) {
                            acc[key] = { count: 0, users: [] };
                          }
                          acc[key].count++;
                          acc[key].users.push(r.user);
                          return acc;
                        }, {})
                      ).map(([emoji, data]) => {
                        const userReacted = data.users.includes(currentUserId);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message._id, emoji)}
                            className={`rounded-full px-2 py-0.5 text-base flex items-center gap-1 transition-colors ${
                              userReacted
                                ? "bg-blue-100 border border-blue-300"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span
                              className={
                                userReacted ? "text-blue-600" : "text-gray-600"
                              }
                            >
                              {data.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timestamp & Status */}
          <div className="flex items-center gap-1.5 mt-1.5 px-1 text-xs text-gray-400">
            <span>{format(message.createdAt, "p")}</span>
            {isMine && (
              <>
                {message.readBy?.length > 1 ? (
                  <CheckCheck
                    size={14}
                    className="text-blue-500"
                    title="Read"
                  />
                ) : message.isDelivered ? (
                  <CheckCheck
                    size={14}
                    className="text-gray-400"
                    title="Delivered"
                  />
                ) : (
                  <Check size={14} className="text-gray-400" title="Sent" />
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
      <div className="flex flex-col items-center justify-center h-full bg-gray-50/30">
        <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-full">
          <svg
            className="w-10 h-10 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-400">
          Select a conversation
        </p>
        <p className="mt-1 text-sm text-gray-300">
          Choose a chat from the list to start messaging
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-gray-50">
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
      <div className="z-10 flex items-center justify-between flex-shrink-0 px-5 py-4 bg-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 rounded-full lg:hidden hover:bg-gray-100"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <Avatar
            src={otherUser?.avatar}
            alt={otherUser?.username}
            fallback={otherUser?.username}
            size="md"
            showOnline
            isOnline={isOnline}
          />
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {otherUser?.fullName || otherUser?.username}
            </h3>
            <p
              className={`text-sm ${
                typingUsers.size > 0
                  ? "text-emerald-500 font-medium"
                  : "text-gray-500"
              }`}
            >
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
          className="rounded-full hover:bg-gray-100"
        >
          <Search className="w-5 h-5 text-gray-500" />
        </Button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 border-b bg-white shadow-sm">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages... (min 2 characters)"
                className="pl-10 pr-4"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={searchLoading || searchQuery.trim().length < 2}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
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
        <div className="px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Found{" "}
              <span className="font-bold text-emerald-600">
                {searchResults.length}
              </span>{" "}
              result{searchResults.length > 1 ? "s" : ""} for "{searchQuery}"
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-2">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => navigateSearchResult("prev")}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => navigateSearchResult("next")}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-40">
            {searchResults.map((msg, index) => (
              <button
                key={msg._id}
                onClick={() => {
                  setCurrentSearchIndex(index);
                  scrollToMessage(msg._id);
                }}
                className={`w-full p-2.5 text-sm text-left rounded-lg transition-colors ${
                  index === currentSearchIndex
                    ? "bg-emerald-100 border border-emerald-300"
                    : "bg-white hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">
                    {msg.sender?.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(msg.createdAt, "MMM d, p")}
                  </span>
                </div>
                <span className="text-gray-600 line-clamp-1">
                  {highlightSearchTerm(msg.content, searchQuery)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-gray-50"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {/* Sticky Exchange Widget - Only show if this chat is related to a post */}
        {chat?.post && !isExchangeDismissed && (
          <div className="sticky top-0 z-10 pb-0 bg-white shadow-sm">
            <ExchangeWidget
              post={chat.post}
              exchange={exchange}
              onExchangeUpdate={setExchange}
              onRequestExchange={() => setShowRequestModal(true)}
            />
          </div>
        )}

        <div className="p-5">
          {loading && (
            <div className="py-4 text-sm text-center text-gray-400">
              Loading history...
            </div>
          )}

          {/* Messages List */}
          <div className="space-y-3">
            {messages.map((msg, i) => renderMessage(msg, i))}
          </div>

          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <div className="flex items-center gap-2 mt-3 ml-10 text-sm italic text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                <span className="w-2 h-2 delay-75 rounded-full bg-emerald-400 animate-bounce"></span>
                <span className="w-2 h-2 delay-150 rounded-full bg-emerald-400 animate-bounce"></span>
              </div>
              Typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-100">
        <MessageInput chatId={chat._id} onMessageSent={scrollToBottom} />
      </div>

      {/* Exchange Request Modal */}
      {showRequestModal && chat.post && (
        <ExchangeRequestModal
          isOpen={showRequestModal}
          post={chat.post}
          onClose={() => setShowRequestModal(false)}
          onConfirm={handleCreateExchangeRequest}
        />
      )}
    </div>
  );
}
