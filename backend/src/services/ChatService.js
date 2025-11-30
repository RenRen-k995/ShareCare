import ChatRepository from "../repositories/ChatRepository.js";
import { Chat, Message } from "../models/Chat.js";

class ChatService {
  async getOrCreateChat(userId1, userId2, postId = null) {
    // Check if chat already exists
    let chat = await ChatRepository.findChatByParticipants(userId1, userId2);

    if (!chat) {
      // Create new chat
      const chatData = {
        participants: [userId1, userId2],
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0,
        },
      };

      if (postId) {
        chatData.post = postId;
      }

      chat = await ChatRepository.createChat(chatData);
      chat = await ChatRepository.findChatByParticipants(userId1, userId2);
    }

    return chat;
  }

  async getUserChats(userId, options = {}) {
    const result = await ChatRepository.findUserChats(userId, options);

    // Add unread count for each chat
    if (result.chats) {
      result.chats = result.chats.map((chat) => {
        const chatObj = chat.toObject ? chat.toObject() : chat;
        chatObj.unreadCount =
          chatObj.unreadCount?.get?.(userId.toString()) || 0;
        return chatObj;
      });
    }

    return result;
  }

  async sendMessage(chatId, senderId, messageData) {
    const {
      content,
      messageType = "text",
      fileUrl,
      fileName,
      fileSize,
    } = messageData;

    // Verify sender is a participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(senderId)) {
      throw new Error("Unauthorized: You are not a participant of this chat");
    }

    const message = await ChatRepository.createMessage({
      chat: chatId,
      sender: senderId,
      content: content || "",
      messageType,
      fileUrl,
      fileName,
      fileSize,
      isDelivered: false,
    });

    // Update chat's last message and timestamp
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();

    // Update unread count for other participants
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId.toString()) {
        const count = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), count + 1);
      }
    });

    await chat.save();

    return message;
  }

  async getChatMessages(chatId, userId, options = {}) {
    // Verify user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      throw new Error("Unauthorized: You are not a participant of this chat");
    }

    const result = await ChatRepository.findMessagesByChat(chatId, options);

    // Mark messages as read
    await this.markMessagesAsRead(chatId, userId);

    return result;
  }

  async markMessagesAsRead(chatId, userId) {
    try {
      // Use bulk update instead of iterating and saving individually
      await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          "readBy.user": { $ne: userId },
        },
        {
          $push: {
            readBy: {
              user: userId,
              readAt: new Date(),
            },
          },
        }
      );

      // Reset unread count
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.unreadCount.set(userId.toString(), 0);
        await chat.save();
      }

      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }
  }

  async addMessageReaction(messageId, userId, emoji) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(userId)) {
      throw new Error("Unauthorized: You are not a participant of this chat");
    }

    // Toggle reaction
    const existingReaction = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction >= 0) {
      message.reactions.splice(existingReaction, 1);
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    return message;
  }

  async searchMessages(chatId, userId, query) {
    // Verify user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      throw new Error("Unauthorized: You are not a participant of this chat");
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

    return messages;
  }

  async getUnreadCount(userId) {
    const chats = await Chat.find({ participants: userId });

    let totalUnread = 0;
    chats.forEach((chat) => {
      const count = chat.unreadCount.get(userId.toString()) || 0;
      totalUnread += count;
    });

    return totalUnread;
  }

  async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error("Message not found");
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== userId.toString()) {
      throw new Error("Unauthorized: You can only delete your own messages");
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    return message;
  }
}

export default new ChatService();
