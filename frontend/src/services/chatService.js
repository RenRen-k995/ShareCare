import api from "../lib/api";

export const chatService = {
  async getOrCreateChat(otherUserId, postId = null) {
    const response = await api.post("/chat", { otherUserId, postId });
    return response.data;
  },

  async getUserChats(params = {}) {
    const response = await api.get("/chat", { params });
    return response.data;
  },

  async sendMessage(chatId, content) {
    const response = await api.post("/chat/message", { chatId, content });
    return response.data;
  },

  async getChatMessages(chatId, params = {}) {
    const response = await api.get(`/chat/${chatId}/messages`, { params });
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get("/chat/unread-count");
    return response.data;
  },

  // Search messages in a chat
  async searchMessages(chatId, query) {
    const response = await api.get(`/chat/${chatId}/search`, {
      params: { q: query },
    });
    return response.data;
  },

  // Get link preview
  async getLinkPreview(url) {
    const response = await api.get("/chat/link-preview", { params: { url } });
    return response.data;
  },
};

export default chatService;
