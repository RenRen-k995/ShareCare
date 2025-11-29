import express from "express";
import ExchangeController from "../controllers/ExchangeController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create exchange request
router.post("/", ExchangeController.createExchange);

// Get user's exchanges
router.get("/my-exchanges", ExchangeController.getUserExchanges);

// Get exchange by chat
router.get("/chat/:chatId", ExchangeController.getExchangeByChat);

// Update exchange status
router.patch("/:exchangeId/status", ExchangeController.updateStatus);

// Schedule meeting
router.patch("/:exchangeId/schedule", ExchangeController.scheduleMeeting);

// Rate exchange
router.post("/:exchangeId/rate", ExchangeController.rateExchange);

// Cancel exchange
router.patch("/:exchangeId/cancel", ExchangeController.cancelExchange);

export default router;
