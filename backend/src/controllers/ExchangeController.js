import ExchangeService from "../services/ExchangeService.js";

class ExchangeController {
  async createExchange(req, res, next) {
    try {
      const { chatId, postId } = req.body;
      // Logic to create exchange request
      const exchange = await ExchangeService.createExchangeRequest(
        chatId,
        postId,
        req.user.id
      );
      res.status(201).json({ exchange });
    } catch (error) {
      next(error);
    }
  }

  async getExchangeByChat(req, res, next) {
    try {
      const { chatId } = req.params;
      const exchange = await ExchangeService.getExchangeByChat(chatId);
      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }

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

      // Emit real-time update to both participants
      const io = req.app.get("io");
      if (io && exchange.chat) {
        io.to(`chat:${exchange.chat}`).emit("exchange:updated", {
          exchangeId: exchange._id,
          exchange,
          status,
          updatedBy: req.user.id,
        });
      }

      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }

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

  async scheduleMeeting(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { meetingDetails } = req.body;

      const exchange = await ExchangeService.scheduleMeeting(
        exchangeId,
        meetingDetails,
        req.user.id
      );

      // Emit real-time update
      const io = req.app.get("io");
      if (io && exchange.chat) {
        io.to(`chat:${exchange.chat}`).emit("exchange:updated", {
          exchangeId: exchange._id,
          exchange,
          status: exchange.status,
          updatedBy: req.user.id,
        });
      }

      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }

  async rateExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { score, feedback } = req.body;

      const exchange = await ExchangeService.rateExchange(
        exchangeId,
        req.user.id,
        score,
        feedback
      );
      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }

  async cancelExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { reason } = req.body;

      const exchange = await ExchangeService.cancelExchange(
        exchangeId,
        req.user.id,
        reason
      );
      res.json({ exchange });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExchangeController();
