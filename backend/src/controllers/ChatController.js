import ChatService from '../services/ChatService.js';

class ChatController {
  async getOrCreateChat(req, res, next) {
    try {
      const { otherUserId } = req.body;

      if (!otherUserId) {
        return res.status(400).json({ message: 'Other user ID is required' });
      }

      const chat = await ChatService.getOrCreateChat(req.user.id, otherUserId);

      res.json({ chat });
    } catch (error) {
      next(error);
    }
  }

  async getUserChats(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const options = { page: parseInt(page), limit: parseInt(limit) };

      const result = await ChatService.getUserChats(req.user.id, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { chatId, content } = req.body;

      if (!chatId || !content) {
        return res.status(400).json({ message: 'Chat ID and content are required' });
      }

      const message = await ChatService.sendMessage(chatId, req.user.id, content);

      res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async getChatMessages(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const options = { page: parseInt(page), limit: parseInt(limit) };

      const result = await ChatService.getChatMessages(req.params.chatId, req.user.id, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();
