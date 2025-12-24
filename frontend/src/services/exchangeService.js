import api from "../lib/api";

/**
 * Exchange Service - Frontend API Client
 *
 * ShareCare là nền tảng DONATE miễn phí
 *
 * WORKFLOW ĐƠN GIẢN:
 * 1. requested  - Người nhận gửi yêu cầu
 * 2. accepted   - Người cho chấp nhận → chat hẹn gặp
 * 3. completed  - Đã giao nhận thành công
 * 4. cancelled  - Đã hủy
 * 5. declined   - Bị từ chối
 */
class ExchangeService {
  // ==================== QUERY ====================

  async getExchangeByChat(chatId) {
    const response = await api.get(`/exchanges/chat/${chatId}`);
    return response.data;
  }

  async getUserExchanges(status = null) {
    const params = status ? { status } : {};
    const response = await api.get("/exchanges/my-exchanges", { params });
    return response.data;
  }

  // ==================== CREATE ====================

  async createExchange(chatId, postId, message = null) {
    const response = await api.post("/exchanges", { chatId, postId, message });
    return response.data;
  }

  // ==================== ACTIONS ====================

  /**
   * Chấp nhận yêu cầu (Giver only)
   */
  async acceptExchange(exchangeId) {
    const response = await api.patch(`/exchanges/${exchangeId}/accept`);
    return response.data;
  }

  /**
   * Từ chối yêu cầu (Giver only)
   */
  async declineExchange(exchangeId, reason = null) {
    const response = await api.patch(`/exchanges/${exchangeId}/decline`, {
      reason,
    });
    return response.data;
  }

  /**
   * Xác nhận hoàn thành giao nhận (Both)
   */
  async completeExchange(exchangeId, note = null) {
    const response = await api.patch(`/exchanges/${exchangeId}/complete`, {
      note,
    });
    return response.data;
  }

  /**
   * Hủy yêu cầu/giao dịch (Both)
   */
  async cancelExchange(exchangeId, reason = null, note = null) {
    const response = await api.patch(`/exchanges/${exchangeId}/cancel`, {
      reason,
      note,
    });
    return response.data;
  }

  // ==================== OPTIONAL ====================

  /**
   * Cập nhật thông tin hẹn gặp
   */
  async updateMeetingDetails(exchangeId, meetingDetails) {
    const response = await api.patch(`/exchanges/${exchangeId}/meeting`, {
      meetingDetails,
    });
    return response.data;
  }

  /**
   * Legacy update status (backward compatibility)
   */
  async updateStatus(exchangeId, status, note = null) {
    const response = await api.patch(`/exchanges/${exchangeId}/status`, {
      status,
      note,
    });
    return response.data;
  }

  // ==================== HELPERS ====================

  /**
   * Lấy thông tin hiển thị theo status
   */
  getStatusInfo(status) {
    const statusMap = {
      requested: {
        label: "Đang chờ xác nhận",
        color: "amber",
        bgColor: "bg-amber-100",
        textColor: "text-amber-800",
        borderColor: "border-amber-200",
        description: "Đang chờ người cho phản hồi",
      },
      accepted: {
        label: "Đã chấp nhận",
        color: "blue",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
        description: "Hãy chat để hẹn gặp giao nhận",
      },
      completed: {
        label: "Hoàn thành",
        color: "green",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200",
        description: "Đã giao nhận thành công",
      },
      cancelled: {
        label: "Đã hủy",
        color: "gray",
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
        description: "Yêu cầu đã bị hủy",
      },
      declined: {
        label: "Đã từ chối",
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-200",
        description: "Yêu cầu đã bị từ chối",
      },
    };
    return statusMap[status] || statusMap.requested;
  }

  /**
   * Lý do hủy
   */
  getCancelReasons() {
    return [
      { value: "changed_mind", label: "Đổi ý" },
      { value: "not_available", label: "Vật phẩm không còn" },
      { value: "no_response", label: "Không phản hồi" },
      { value: "cannot_meet", label: "Không thể hẹn gặp" },
      { value: "other", label: "Lý do khác" },
    ];
  }
}

export default new ExchangeService();
