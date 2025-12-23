import ExchangeRepository from "../repositories/ExchangeRepository.js";
import { Chat } from "../models/Chat.js";
import Post from "../models/Post.js";

/**
 * Exchange Service - Simplified for Donation Platform
 *
 * ShareCare là nền tảng chia sẻ MIỄN PHÍ
 *
 * WORKFLOW ĐƠN GIẢN:
 * 1. Người nhận gửi yêu cầu (requested)
 * 2. Người cho chấp nhận (accepted) → 2 bên chat hẹn gặp
 * 3. Một trong hai xác nhận đã giao/nhận (completed)
 *
 * QUAN TRỌNG - XÁC ĐỊNH VAI TRÒ:
 * - GIVER (người cho) = Tác giả của bài POST
 * - RECEIVER (người nhận) = Người KHÔNG phải tác giả trong cuộc chat
 */
class ExchangeService {
  // ==================== VALID TRANSITIONS ====================
  static VALID_TRANSITIONS = {
    requested: ["accepted", "declined", "cancelled"],
    accepted: ["completed", "cancelled"],
    completed: [], // Terminal
    cancelled: [], // Terminal
    declined: [], // Terminal
  };

  // ==================== CREATE REQUEST ====================

  /**
   * Tạo yêu cầu nhận vật phẩm
   * Chỉ RECEIVER (người không phải tác giả) mới có thể tạo request
   */
  async createExchangeRequest(chatId, postId, requesterId, message = null) {
    // 1. Kiểm tra chat tồn tại
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Không tìm thấy cuộc trò chuyện");

    // Kiểm tra user là participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === requesterId.toString()
    );
    if (!isParticipant) {
      throw new Error("Bạn không phải thành viên của cuộc trò chuyện này");
    }

    // 2. Kiểm tra post tồn tại và còn available
    const post = await Post.findById(postId).populate("author");
    if (!post) throw new Error("Không tìm thấy bài đăng");
    if (post.status !== "available") {
      throw new Error("Vật phẩm này đã được cho hoặc đang có người xin");
    }

    // 3. XÁC ĐỊNH VAI TRÒ - QUAN TRỌNG!
    // GIVER = Tác giả của bài post
    const giverId = post.author._id.toString();

    // RECEIVER = Người gửi request (không phải tác giả)
    // Kiểm tra: Người gửi request KHÔNG được là tác giả
    if (requesterId.toString() === giverId) {
      throw new Error("Bạn không thể tự xin vật phẩm của chính mình");
    }

    const receiverId = requesterId.toString();

    // 4. Kiểm tra đã có exchange active chưa
    const existing = await ExchangeRepository.findActiveByChat(chatId);
    if (existing) {
      throw new Error("Đã có yêu cầu đang chờ xử lý cho vật phẩm này");
    }

    // 5. Tạo exchange
    const exchangeData = {
      chat: chatId,
      post: postId,
      giver: giverId,
      receiver: receiverId,
      status: "requested",
      message: message,
    };

    // 6. Cập nhật post status thành pending
    await Post.findByIdAndUpdate(postId, { status: "pending" });

    return await ExchangeRepository.create(exchangeData);
  }

  // ==================== ACCEPT / DECLINE ====================

  /**
   * Chấp nhận yêu cầu (Chỉ GIVER)
   */
  async acceptExchange(exchangeId, userId) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Không tìm thấy yêu cầu");

    // Chỉ GIVER mới được chấp nhận
    const giverId =
      exchange.giver._id?.toString() || exchange.giver?.toString();
    if (giverId !== userId.toString()) {
      throw new Error("Chỉ người cho mới có thể chấp nhận yêu cầu");
    }

    // Kiểm tra trạng thái
    if (exchange.status !== "requested") {
      throw new Error("Yêu cầu này không thể chấp nhận");
    }

    return await ExchangeRepository.update(exchangeId, {
      status: "accepted",
    });
  }

  /**
   * Từ chối yêu cầu (Chỉ GIVER)
   */
  async declineExchange(exchangeId, userId, reason = null) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Không tìm thấy yêu cầu");

    // Chỉ GIVER mới được từ chối
    const giverId =
      exchange.giver._id?.toString() || exchange.giver?.toString();
    if (giverId !== userId.toString()) {
      throw new Error("Chỉ người cho mới có thể từ chối yêu cầu");
    }

    if (exchange.status !== "requested") {
      throw new Error("Yêu cầu này không thể từ chối");
    }

    // Đặt lại post status về available
    const postId = exchange.post._id || exchange.post;
    await Post.findByIdAndUpdate(postId, { status: "available" });

    return await ExchangeRepository.update(exchangeId, {
      status: "declined",
      cancelReason: reason,
    });
  }

  // ==================== COMPLETE / CANCEL ====================

  /**
   * Xác nhận đã giao/nhận thành công
   * Cả 2 bên đều có thể xác nhận hoàn thành
   */
  async completeExchange(exchangeId, userId, note = null) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Không tìm thấy yêu cầu");

    // Kiểm tra user là participant
    if (!this._isParticipant(exchange, userId)) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    // Chỉ có thể hoàn thành từ trạng thái accepted
    if (exchange.status !== "accepted") {
      throw new Error("Chỉ có thể hoàn thành khi đã được chấp nhận");
    }

    // Cập nhật post status thành donated
    const postId = exchange.post._id || exchange.post;
    await Post.findByIdAndUpdate(postId, { status: "donated" });

    return await ExchangeRepository.update(exchangeId, {
      status: "completed",
      completedAt: new Date(),
      completedBy: userId,
      completionNote: note,
    });
  }

  /**
   * Hủy yêu cầu/giao dịch
   * Cả 2 bên đều có thể hủy (trước khi hoàn thành)
   */
  async cancelExchange(exchangeId, userId, reason = null, note = null) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Không tìm thấy yêu cầu");

    // Kiểm tra user là participant
    if (!this._isParticipant(exchange, userId)) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    // Không thể hủy đã hoàn thành hoặc đã hủy
    if (["completed", "cancelled", "declined"].includes(exchange.status)) {
      throw new Error("Không thể hủy yêu cầu này");
    }

    // Đặt lại post status về available
    const postId = exchange.post._id || exchange.post;
    await Post.findByIdAndUpdate(postId, { status: "available" });

    return await ExchangeRepository.update(exchangeId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancelReason: reason,
      cancelNote: note,
    });
  }

  // ==================== MEETING DETAILS (Optional) ====================

  /**
   * Cập nhật thông tin hẹn gặp (optional feature)
   */
  async updateMeetingDetails(exchangeId, userId, meetingDetails) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Không tìm thấy yêu cầu");

    if (!this._isParticipant(exchange, userId)) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    if (exchange.status !== "accepted") {
      throw new Error("Chỉ có thể cập nhật khi đã được chấp nhận");
    }

    return await ExchangeRepository.update(exchangeId, {
      meetingDetails: meetingDetails,
    });
  }

  // ==================== QUERY METHODS ====================

  async getExchangeByChat(chatId) {
    return await ExchangeRepository.findByChat(chatId);
  }

  async getExchangeById(exchangeId) {
    return await ExchangeRepository.findById(exchangeId);
  }

  async getUserExchanges(userId, status = null) {
    return await ExchangeRepository.findByUser(userId, status);
  }

  // ==================== LEGACY SUPPORT ====================

  /**
   * Legacy method for backward compatibility
   */
  async updateExchangeStatus(exchangeId, status, userId, note = null) {
    switch (status) {
      case "accepted":
        return await this.acceptExchange(exchangeId, userId);
      case "declined":
        return await this.declineExchange(exchangeId, userId, note);
      case "completed":
        return await this.completeExchange(exchangeId, userId, note);
      case "cancelled":
        return await this.cancelExchange(exchangeId, userId, null, note);
      default:
        throw new Error(`Trạng thái không hợp lệ: ${status}`);
    }
  }

  // ==================== PRIVATE HELPERS ====================

  _isParticipant(exchange, userId) {
    const giverId =
      exchange.giver._id?.toString() || exchange.giver?.toString();
    const receiverId =
      exchange.receiver._id?.toString() || exchange.receiver?.toString();
    return giverId === userId.toString() || receiverId === userId.toString();
  }

  _isGiver(exchange, userId) {
    const giverId =
      exchange.giver._id?.toString() || exchange.giver?.toString();
    return giverId === userId.toString();
  }

  _isReceiver(exchange, userId) {
    const receiverId =
      exchange.receiver._id?.toString() || exchange.receiver?.toString();
    return receiverId === userId.toString();
  }
}

export default new ExchangeService();
