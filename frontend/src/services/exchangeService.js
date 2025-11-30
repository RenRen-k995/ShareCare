import api from "../lib/api";

class ExchangeService {
  async createExchange(chatId, postId) {
    const response = await api.post("/exchanges", { chatId, postId });
    return response.data;
  }

  async getExchangeByChat(chatId) {
    const response = await api.get(`/exchanges/chat/${chatId}`);
    return response.data;
  }

  async getUserExchanges(status = null) {
    const params = status ? { status } : {};
    const response = await api.get("/exchanges/my-exchanges", { params });
    return response.data;
  }

  async updateStatus(exchangeId, status, note = null) {
    const response = await api.patch(`/exchanges/${exchangeId}/status`, {
      status,
      note,
    });
    return response.data;
  }

  async scheduleMeeting(exchangeId, meetingDetails) {
    const response = await api.patch(`/exchanges/${exchangeId}/schedule`, {
      meetingDetails,
    });
    return response.data;
  }

  async rateExchange(exchangeId, score, feedback) {
    const response = await api.post(`/exchanges/${exchangeId}/rate`, {
      score,
      feedback,
    });
    return response.data;
  }

  async cancelExchange(exchangeId, reason) {
    const response = await api.patch(`/exchanges/${exchangeId}/cancel`, {
      reason,
    });
    return response.data;
  }
}

export default new ExchangeService();
