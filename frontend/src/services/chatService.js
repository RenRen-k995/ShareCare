import api from '../lib/api';

export const chatService = {
  async getOrCreateChat(otherUserId) {
    const response = await api.post('/chat/chat', { otherUserId });
    return response.data;
  },

  async getUserChats(params = {}) {
    const response = await api.get('/chat/chats', { params });
    return response.data;
  },

  async sendMessage(chatId, content) {
    const response = await api.post('/chat/message', { chatId, content });
    return response.data;
  },

  async getChatMessages(chatId, params = {}) {
    const response = await api.get(`/chat/chat/${chatId}/messages`, { params });
    return response.data;
  }
};

export default chatService;
