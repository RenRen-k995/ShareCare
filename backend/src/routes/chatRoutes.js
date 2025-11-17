import express from 'express';
import ChatController from '../controllers/ChatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.post('/chat', authenticate, ChatController.getOrCreateChat);
router.get('/chats', authenticate, ChatController.getUserChats);
router.post('/message', authenticate, ChatController.sendMessage);
router.get('/chat/:chatId/messages', authenticate, ChatController.getChatMessages);

export default router;
