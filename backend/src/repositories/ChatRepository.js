import { Chat, Message } from "../models/Chat.js";

class ChatRepository {
  async createChat(chatData) {
    const chat = new Chat(chatData);
    return await chat.save();
  }

  async findChatByParticipants(userId1, userId2) {
    return await Chat.findOne({
      participants: { $all: [userId1, userId2], $size: 2 },
    }).populate("participants", "username fullName avatar");
  }

  async findUserChats(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "username fullName avatar")
      .populate("lastMessage")
      .sort("-updatedAt")
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments({ participants: userId });

    return { chats, total, page, pages: Math.ceil(total / limit) };
  }

  async createMessage(messageData) {
    const message = new Message(messageData);
    const savedMessage = await message.save();

    // Update chat's last message and timestamp
    await Chat.findByIdAndUpdate(messageData.chat, {
      lastMessage: savedMessage._id,
      updatedAt: new Date(),
    });

    return await Message.findById(savedMessage._id).populate(
      "sender",
      "username fullName avatar"
    );
  }

  async findMessagesByChat(chatId, options = {}) {
    const { page = 1, limit = 50, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username fullName avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ chat: chatId });

    return { messages, total, page, pages: Math.ceil(total / limit) };
  }

  async markMessagesAsRead(chatId, userId) {
    return await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, isRead: false },
      { isRead: true }
    );
  }
}

export default new ChatRepository();
