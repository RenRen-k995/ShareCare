import express from 'express';
import ChatController from '../controllers/ChatController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected
router.post('/chat', apiLimiter, authenticate, ChatController.getOrCreateChat);
router.get('/chats', apiLimiter, authenticate, ChatController.getUserChats);
router.post('/message', apiLimiter, authenticate, ChatController.sendMessage);
router.get('/chat/:chatId/messages', apiLimiter, authenticate, ChatController.getChatMessages);

export default router;
