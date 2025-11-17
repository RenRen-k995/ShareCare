import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
        reconnectionAttempts: 5,
      }
    );

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
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
  }, []);

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

  const value = {
    socket,
    connected,
    onlineUsers,
    joinChat,
    sendMessage,
    markMessageAsRead,
    sendTypingStart,
    sendTypingStop,
    reactToMessage,
    searchChat,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
