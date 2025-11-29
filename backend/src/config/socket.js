import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Chat, Message } from "../models/Chat.js";
import User from "../models/User.js";

const connectedUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // chatId -> Set of userIds

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Track connected user
    connectedUsers.set(socket.userId, socket.id);

    // Notify user is online
    socket.broadcast.emit("user:online", { userId: socket.userId });

    // Send pending messages to newly connected user
    await deliverPendingMessages(socket, io);

    // Join user's personal room for direct notifications
    socket.join(`user:${socket.userId}`);

    // Join all user's chat rooms
    const userChats = await Chat.find({ participants: socket.userId });
    userChats.forEach((chat) => {
      socket.join(`chat:${chat._id}`);
    });

    // Handle joining a specific chat
    socket.on("chat:join", async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit("error", { message: "Unauthorized access to chat" });
          return;
        }

        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Handle sending messages
    socket.on("message:send", async (data) => {
      try {
        const {
          chatId,
          content,
          messageType = "text",
          fileUrl,
          fileName,
          fileSize,
        } = data;

        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit("error", { message: "Unauthorized access to chat" });
          return;
        }

        // Create message
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content: content || "",
          messageType,
          fileUrl,
          fileName,
          fileSize,
          isDelivered: false,
        });

        await message.populate("sender", "username fullName avatar");

        // Update chat's last message
        chat.lastMessage = message._id;
        chat.updatedAt = new Date();

        // Update unread count for other participants
        chat.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId) {
            const count = chat.unreadCount.get(participantId.toString()) || 0;
            chat.unreadCount.set(participantId.toString(), count + 1);
          }
        });

        await chat.save();

        // Get the recipient user object for unread count notification
        const recipientId = chat.participants
          .find((id) => id.toString() !== socket.userId)
          .toString();

        // Populate the full chat to send unread count
        await chat.populate("participants", "username fullName avatar");

        // Check if recipient is online
        const recipientSocketId = connectedUsers.get(recipientId);

        if (recipientSocketId) {
          // Recipient is online - deliver immediately
          message.isDelivered = true;
          message.deliveredAt = new Date();
          await message.save();

          // Emit to recipient with unread count
          io.to(recipientSocketId).emit("message:receive", {
            message: message.toObject(),
            chatId,
            unreadCount: chat.unreadCount.get(recipientId) || 0,
          });

          // Send delivery confirmation to sender
          socket.emit("message:delivered", {
            messageId: message._id,
            deliveredAt: message.deliveredAt,
          });
        } else {
          // Recipient offline - message will be delivered when they connect
          socket.emit("message:sent", {
            message: message.toObject(),
            chatId,
          });
        }

        // Update chat list for all participants
        io.to(`chat:${chatId}`).emit("chat:updated", {
          chatId,
          lastMessage: message.toObject(),
          updatedAt: chat.updatedAt,
        });
      } catch (error) {
        console.error("Message send error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle typing indicator
    socket.on("typing:start", async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.includes(socket.userId)) {
          return;
        }

        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }
        typingUsers.get(chatId).add(socket.userId);

        socket.to(`chat:${chatId}`).emit("typing:user", {
          chatId,
          userId: socket.userId,
          isTyping: true,
        });
      } catch (error) {
        console.error("Typing start error:", error);
      }
    });

    socket.on("typing:stop", async ({ chatId }) => {
      try {
        if (typingUsers.has(chatId)) {
          typingUsers.get(chatId).delete(socket.userId);
        }

        socket.to(`chat:${chatId}`).emit("typing:user", {
          chatId,
          userId: socket.userId,
          isTyping: false,
        });
      } catch (error) {
        console.error("Typing stop error:", error);
      }
    });

    // Handle read receipts
    socket.on("message:read", async ({ messageId, chatId }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          return;
        }

        // Add read receipt
        const alreadyRead = message.readBy.some(
          (r) => r.user.toString() === socket.userId
        );

        if (!alreadyRead) {
          message.readBy.push({ user: socket.userId, readAt: new Date() });
          await message.save();

          // Reset unread count for this user
          chat.unreadCount.set(socket.userId, 0);
          await chat.save();

          // Notify sender about read receipt
          socket.to(`chat:${chatId}`).emit("message:read:update", {
            messageId,
            chatId,
            readBy: socket.userId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Message read error:", error);
      }
    });

    // Handle marking chat as read when user opens it
    socket.on("chat:mark_read", async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(socket.userId)) {
          return;
        }

        // Mark all unread messages as read
        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: socket.userId },
            "readBy.user": { $ne: socket.userId },
          },
          {
            $push: { readBy: { user: socket.userId, readAt: new Date() } },
          }
        );

        // Reset unread count
        const oldCount = chat.unreadCount.get(socket.userId.toString()) || 0;
        chat.unreadCount.set(socket.userId.toString(), 0);
        await chat.save();

        // Notify the user that unread count is cleared
        socket.emit("chat:unread_cleared", { chatId, oldCount });

        // Notify other participants that messages were read
        socket.to(`chat:${chatId}`).emit("chat:messages_read", {
          chatId,
          userId: socket.userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Chat mark read error:", error);
      }
    });

    // Get total unread count for user
    socket.on("chat:get_unread_count", async () => {
      try {
        const chats = await Chat.find({ participants: socket.userId });
        let totalUnread = 0;

        chats.forEach((chat) => {
          const count = chat.unreadCount.get(socket.userId.toString()) || 0;
          totalUnread += count;
        });

        socket.emit("chat:total_unread", { count: totalUnread });
      } catch (error) {
        console.error("Get unread count error:", error);
      }
    });

    // Handle message reactions
    socket.on("message:react", async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          return;
        }

        const chat = await Chat.findById(message.chat);
        if (!chat || !chat.participants.includes(socket.userId)) {
          return;
        }

        // Toggle reaction
        const existingReaction = message.reactions.findIndex(
          (r) => r.user.toString() === socket.userId && r.emoji === emoji
        );

        if (existingReaction >= 0) {
          message.reactions.splice(existingReaction, 1);
        } else {
          message.reactions.push({ user: socket.userId, emoji });
        }

        await message.save();

        io.to(`chat:${message.chat}`).emit("message:reaction:update", {
          messageId,
          chatId: message.chat,
          reactions: message.reactions,
        });
      } catch (error) {
        console.error("Message reaction error:", error);
      }
    });

    // Handle chat search
    socket.on("chat:search", async ({ query, chatId }) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit("error", { message: "Unauthorized access to chat" });
          return;
        }

        const messages = await Message.find({
          chat: chatId,
          $or: [
            { content: { $regex: query, $options: "i" } },
            { fileName: { $regex: query, $options: "i" } },
          ],
        })
          .populate("sender", "username fullName avatar")
          .sort({ createdAt: -1 })
          .limit(50);

        socket.emit("chat:search:results", {
          chatId,
          query,
          results: messages,
        });
      } catch (error) {
        console.error("Chat search error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);

      // Clean up typing indicators
      typingUsers.forEach((users, chatId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(`chat:${chatId}`).emit("typing:user", {
            chatId,
            userId: socket.userId,
            isTyping: false,
          });
        }
      });

      // Notify user is offline
      socket.broadcast.emit("user:offline", { userId: socket.userId });
    });
  });

  return io;
};

// Helper function to deliver pending messages
async function deliverPendingMessages(socket, io) {
  try {
    // Find all chats where user is a participant
    const userChats = await Chat.find({ participants: socket.userId });
    const chatIds = userChats.map((chat) => chat._id);

    // Find undelivered messages in these chats
    const pendingMessages = await Message.find({
      chat: { $in: chatIds },
      sender: { $ne: socket.userId },
      isDelivered: false,
    })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: 1 });

    if (pendingMessages.length > 0) {
      console.log(
        `Delivering ${pendingMessages.length} pending messages to user ${socket.userId}`
      );

      for (const message of pendingMessages) {
        // Mark as delivered
        message.isDelivered = true;
        message.deliveredAt = new Date();
        await message.save();

        // Send to user
        socket.emit("message:receive", {
          message: message.toObject(),
          chatId: message.chat,
        });

        // Notify sender about delivery
        const senderSocketId = connectedUsers.get(
          message.sender._id.toString()
        );
        if (senderSocketId) {
          io.to(senderSocketId).emit("message:delivered", {
            messageId: message._id,
            deliveredAt: message.deliveredAt,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error delivering pending messages:", error);
  }
}

export { connectedUsers };
