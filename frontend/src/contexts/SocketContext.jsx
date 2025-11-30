import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  // Use ref for message queue to avoid triggering socket recreation
  const messageQueueRef = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    const newSocket = io(
      import.meta.env.VITE_API_URL || "http://localhost:5000",
      {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 20000,
      }
    );

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
      setConnectionStatus("connected");
      setReconnectAttempt(0);

      // Send queued messages
      if (messageQueueRef.current.length > 0) {
        messageQueueRef.current.forEach((msg) => {
          newSocket.emit(msg.event, msg.data);
        });
        messageQueueRef.current = [];
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
      setConnectionStatus("disconnected");
    });

    newSocket.on("reconnect_attempt", (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      setConnectionStatus("connecting");
      setReconnectAttempt(attempt);
    });

    newSocket.on("reconnect", (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
      setConnectionStatus("connected");
      setReconnectAttempt(0);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
      setConnectionStatus("disconnected");
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
      setConnectionStatus("disconnected");
    });

    newSocket.on("user:online", ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on("user:offline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []); // Remove messageQueue from dependencies

  const joinChat = useCallback(
    (chatId) => {
      if (socket && connected) {
        socket.emit("chat:join", { chatId });
      }
    },
    [socket, connected]
  );

  const sendMessage = useCallback(
    (data) => {
      if (socket && connected) {
        socket.emit("message:send", data);
      } else {
        // Queue message if offline using ref
        messageQueueRef.current = [...messageQueueRef.current, { event: "message:send", data }];
      }
    },
    [socket, connected]
  );

  const markMessageAsRead = useCallback(
    (messageId, chatId) => {
      if (socket && connected) {
        socket.emit("message:read", { messageId, chatId });
      }
    },
    [socket, connected]
  );

  const markChatAsRead = useCallback(
    (chatId) => {
      if (socket && connected) {
        socket.emit("chat:mark_read", { chatId });
      }
    },
    [socket, connected]
  );

  const getTotalUnreadCount = useCallback(() => {
    if (socket && connected) {
      socket.emit("chat:get_unread_count");
    }
  }, [socket, connected]);

  const sendTypingStart = useCallback(
    (chatId) => {
      if (socket && connected) {
        socket.emit("typing:start", { chatId });
      }
    },
    [socket, connected]
  );

  const sendTypingStop = useCallback(
    (chatId) => {
      if (socket && connected) {
        socket.emit("typing:stop", { chatId });
      }
    },
    [socket, connected]
  );

  const reactToMessage = useCallback(
    (messageId, emoji) => {
      if (socket && connected) {
        socket.emit("message:react", { messageId, emoji });
      }
    },
    [socket, connected]
  );

  const searchChat = useCallback(
    (query, chatId) => {
      if (socket && connected) {
        socket.emit("chat:search", { query, chatId });
      }
    },
    [socket, connected]
  );

  const updateExchangeStatus = useCallback(
    (exchangeId, status, note) => {
      if (socket && connected) {
        socket.emit("exchange:update", { exchangeId, status, note });
      }
    },
    [socket, connected]
  );

  const value = {
    socket,
    connected,
    connectionStatus,
    reconnectAttempt,
    onlineUsers,
    joinChat,
    sendMessage,
    markMessageAsRead,
    markChatAsRead,
    getTotalUnreadCount,
    sendTypingStart,
    sendTypingStop,
    reactToMessage,
    searchChat,
    updateExchangeStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
