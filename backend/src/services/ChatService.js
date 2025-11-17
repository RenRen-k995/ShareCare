import ChatRepository from '../repositories/ChatRepository.js';

class ChatService {
  async getOrCreateChat(userId1, userId2) {
    // Check if chat already exists
    let chat = await ChatRepository.findChatByParticipants(userId1, userId2);

    if (!chat) {
      // Create new chat
      chat = await ChatRepository.createChat([userId1, userId2]);
      chat = await ChatRepository.findChatByParticipants(userId1, userId2);
    }

    return chat;
  }

  async getUserChats(userId, options = {}) {
    return await ChatRepository.findUserChats(userId, options);
  }

  async sendMessage(chatId, senderId, content) {
    // You might want to verify the sender is a participant
    const messageData = {
      chat: chatId,
      sender: senderId,
      content
    };

    const message = await ChatRepository.createMessage(messageData);
    return message;
  }

  async getChatMessages(chatId, userId, options = {}) {
    // You might want to verify the user is a participant
    const result = await ChatRepository.findMessagesByChat(chatId, options);

    // Mark messages as read
    await ChatRepository.markMessagesAsRead(chatId, userId);

    return result;
  }
}

export default new ChatService();
