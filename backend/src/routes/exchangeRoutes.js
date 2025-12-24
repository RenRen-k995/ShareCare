import express from "express";
import ExchangeController from "../controllers/ExchangeController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All exchange routes require authentication
router.use(authenticate);
router.use(apiLimiter);

/**
 * Exchange Routes - Simplified for Donation Platform
 *
 * WORKFLOW:
 * 1. POST /              - Receiver gửi yêu cầu nhận vật phẩm
 * 2. PATCH /:id/accept   - Giver chấp nhận yêu cầu
 * 3. PATCH /:id/decline  - Giver từ chối yêu cầu
 * 4. PATCH /:id/complete - Một trong 2 bên xác nhận đã giao/nhận
 * 5. PATCH /:id/cancel   - Một trong 2 bên hủy
 */

// ==================== QUERY ROUTES ====================

/**
 * GET /api/exchanges/my-exchanges
 * Lấy danh sách exchanges của user hiện tại
 * Query: ?status=requested,accepted,completed,cancelled,declined
 */
router.get(
  "/my-exchanges",
  ExchangeController.getUserExchanges.bind(ExchangeController)
);

/**
 * GET /api/exchanges/chat/:chatId
 * Lấy exchange theo chat ID
 */
router.get(
  "/chat/:chatId",
  ExchangeController.getExchangeByChat.bind(ExchangeController)
);

// ==================== CREATE ROUTE ====================

/**
 * POST /api/exchanges
 * Tạo yêu cầu nhận vật phẩm (RECEIVER only)
 * Body: { chatId, postId, message? }
 */
router.post("/", ExchangeController.createExchange.bind(ExchangeController));

// ==================== ACTION ROUTES ====================

/**
 * PATCH /api/exchanges/:exchangeId/accept
 * Chấp nhận yêu cầu (GIVER only)
 */
router.patch(
  "/:exchangeId/accept",
  ExchangeController.acceptExchange.bind(ExchangeController)
);

/**
 * PATCH /api/exchanges/:exchangeId/decline
 * Từ chối yêu cầu (GIVER only)
 * Body: { reason? }
 */
router.patch(
  "/:exchangeId/decline",
  ExchangeController.declineExchange.bind(ExchangeController)
);

/**
 * PATCH /api/exchanges/:exchangeId/complete
 * Xác nhận đã giao/nhận thành công (Both)
 * Body: { note? }
 */
router.patch(
  "/:exchangeId/complete",
  ExchangeController.completeExchange.bind(ExchangeController)
);

/**
 * PATCH /api/exchanges/:exchangeId/cancel
 * Hủy yêu cầu/giao dịch (Both)
 * Body: { reason?, note? }
 */
router.patch(
  "/:exchangeId/cancel",
  ExchangeController.cancelExchange.bind(ExchangeController)
);

// ==================== OPTIONAL ROUTES ====================

/**
 * PATCH /api/exchanges/:exchangeId/meeting
 * Cập nhật thông tin hẹn gặp (Both)
 * Body: { meetingDetails: { scheduledTime?, location?, notes? } }
 */
router.patch(
  "/:exchangeId/meeting",
  ExchangeController.updateMeetingDetails.bind(ExchangeController)
);

/**
 * PATCH /api/exchanges/:exchangeId/status
 * Legacy update status endpoint (backward compatibility)
 * Body: { status, note? }
 */
router.patch(
  "/:exchangeId/status",
  ExchangeController.updateStatus.bind(ExchangeController)
);

export default router;
