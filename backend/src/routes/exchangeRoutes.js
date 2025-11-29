import express from "express";
import ExchangeController from "../controllers/ExchangeController.js";
import { authenticate } from "../middleware/auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All exchange routes require authentication
router.use(authenticate);
router.use(apiLimiter);

/**
 * @route POST /api/exchanges
 * @desc Create a new exchange request from a chat
 */
router.post("/", ExchangeController.createExchange);

/**
 * @route GET /api/exchanges/my-exchanges
 * @desc Get all exchanges for the current user (as giver or receiver)
 */
router.get("/my-exchanges", ExchangeController.getUserExchanges);

/**
 * @route GET /api/exchanges/chat/:chatId
 * @desc Get the active exchange associated with a specific chat room
 */
router.get("/chat/:chatId", ExchangeController.getExchangeByChat);

/**
 * @route PATCH /api/exchanges/:exchangeId/status
 * @desc Update the status of an exchange (accept, decline, complete, etc.)
 */
router.patch("/:exchangeId/status", ExchangeController.updateStatus);

/**
 * @route PATCH /api/exchanges/:exchangeId/schedule
 * @desc Schedule or reschedule the meeting details
 */
router.patch("/:exchangeId/schedule", ExchangeController.scheduleMeeting);

/**
 * @route POST /api/exchanges/:exchangeId/rate
 * @desc Rate the other party after completion
 */
router.post("/:exchangeId/rate", ExchangeController.rateExchange);

/**
 * @route PATCH /api/exchanges/:exchangeId/cancel
 * @desc Cancel an exchange
 */
router.patch("/:exchangeId/cancel", ExchangeController.cancelExchange);

export default router;
