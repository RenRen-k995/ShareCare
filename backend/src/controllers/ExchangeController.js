import ExchangeService from "../services/ExchangeService.js";

/**
 * Exchange Controller - Simplified for Donation Platform
 */
class ExchangeController {
  // ==================== CREATE ====================

  /**
   * Tạo yêu cầu nhận vật phẩm
   * POST /api/exchanges
   */
  async createExchange(req, res, next) {
    try {
      const { chatId, postId, message } = req.body;

      const exchange = await ExchangeService.createExchangeRequest(
        chatId,
        postId,
        req.user.id,
        message
      );

      // Emit real-time update
      this._emitExchangeUpdate(req, exchange, "created");

      res.status(201).json({
        success: true,
        exchange,
        message: "Đã gửi yêu cầu nhận vật phẩm",
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== GET ====================

  /**
   * Lấy exchange theo chat ID
   * GET /api/exchanges/chat/:chatId
   */
  async getExchangeByChat(req, res, next) {
    try {
      const { chatId } = req.params;
      const exchange = await ExchangeService.getExchangeByChat(chatId);
      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách exchanges của user
   * GET /api/exchanges/my-exchanges
   */
  async getUserExchanges(req, res, next) {
    try {
      const { status } = req.query;
      const exchanges = await ExchangeService.getUserExchanges(
        req.user.id,
        status
      );
      res.json({ exchanges });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ACTIONS ====================

  /**
   * Chấp nhận yêu cầu (GIVER only)
   * PATCH /api/exchanges/:exchangeId/accept
   */
  async acceptExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;

      const exchange = await ExchangeService.acceptExchange(
        exchangeId,
        req.user.id
      );

      this._emitExchangeUpdate(req, exchange, "accepted");

      res.json({
        success: true,
        exchange,
        message: "Đã chấp nhận yêu cầu",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Từ chối yêu cầu (GIVER only)
   * PATCH /api/exchanges/:exchangeId/decline
   */
  async declineExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { reason } = req.body;

      const exchange = await ExchangeService.declineExchange(
        exchangeId,
        req.user.id,
        reason
      );

      this._emitExchangeUpdate(req, exchange, "declined");

      res.json({
        success: true,
        exchange,
        message: "Đã từ chối yêu cầu",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xác nhận đã giao/nhận thành công
   * PATCH /api/exchanges/:exchangeId/complete
   */
  async completeExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { note } = req.body;

      const exchange = await ExchangeService.completeExchange(
        exchangeId,
        req.user.id,
        note
      );

      this._emitExchangeUpdate(req, exchange, "completed");

      res.json({
        success: true,
        exchange,
        message: "Đã hoàn thành giao nhận",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hủy yêu cầu/giao dịch
   * PATCH /api/exchanges/:exchangeId/cancel
   */
  async cancelExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { reason, note } = req.body;

      const exchange = await ExchangeService.cancelExchange(
        exchangeId,
        req.user.id,
        reason,
        note
      );

      this._emitExchangeUpdate(req, exchange, "cancelled");

      res.json({
        success: true,
        exchange,
        message: "Đã hủy yêu cầu",
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== MEETING DETAILS (Optional) ====================

  /**
   * Cập nhật thông tin hẹn gặp
   * PATCH /api/exchanges/:exchangeId/meeting
   */
  async updateMeetingDetails(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { meetingDetails } = req.body;

      const exchange = await ExchangeService.updateMeetingDetails(
        exchangeId,
        req.user.id,
        meetingDetails
      );

      this._emitExchangeUpdate(req, exchange, "meeting_updated");

      res.json({
        success: true,
        exchange,
        message: "Đã cập nhật thông tin hẹn gặp",
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LEGACY SUPPORT ====================

  /**
   * Legacy update status endpoint
   * PATCH /api/exchanges/:exchangeId/status
   */
  async updateStatus(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { status, note } = req.body;

      const exchange = await ExchangeService.updateExchangeStatus(
        exchangeId,
        status,
        req.user.id,
        note
      );

      this._emitExchangeUpdate(req, exchange, status);

      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Emit real-time update via Socket.IO
   */
  _emitExchangeUpdate(req, exchange, eventType) {
    if (req.app.get("io")) {
      const io = req.app.get("io");
      const chatRoom = `chat:${exchange.chat._id || exchange.chat}`;

      io.to(chatRoom).emit("exchange:updated", {
        exchangeId: exchange._id,
        exchange,
        status: exchange.status,
        eventType,
      });

      io.to(chatRoom).emit("exchange:status_changed", {
        exchangeId: exchange._id,
        status: exchange.status,
        eventType,
      });
    }
  }
}

export default new ExchangeController();
