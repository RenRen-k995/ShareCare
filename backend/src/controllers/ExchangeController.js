import ExchangeService from "../services/ExchangeService.js";

class ExchangeController {
  async createExchange(req, res, next) {
    try {
      const { chatId, postId } = req.body;

      if (!chatId || !postId) {
        return res.status(400).json({
          message: "Chat ID and Post ID are required",
        });
      }

      const exchange = await ExchangeService.createExchangeRequest(
        chatId,
        postId,
        req.user.id
      );

      res.status(201).json({
        message: "Exchange request created",
        exchange,
      });
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

  async updateStatus(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const exchange = await ExchangeService.updateExchangeStatus(
        exchangeId,
        status,
        req.user.id,
        note
      );

      res.json({
        message: "Exchange status updated",
        exchange,
      });
    } catch (error) {
      next(error);
    }
  }

  async scheduleMeeting(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { meetingDetails } = req.body;

      if (!meetingDetails) {
        return res
          .status(400)
          .json({ message: "Meeting details are required" });
      }

      const exchange = await ExchangeService.scheduleMeeting(
        exchangeId,
        req.user.id,
        meetingDetails
      );

      res.json({
        message: "Meeting scheduled",
        exchange,
      });
    } catch (error) {
      next(error);
    }
  }

  async rateExchange(req, res, next) {
    try {
      const { exchangeId } = req.params;
      const { score, feedback } = req.body;

      if (!score) {
        return res.status(400).json({ message: "Rating score is required" });
      }

      const exchange = await ExchangeService.rateExchange(
        exchangeId,
        req.user.id,
        {
          score,
          feedback,
        }
      );

      res.json({
        message: "Exchange rated",
        exchange,
      });
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

      res.json({
        message: "Exchange cancelled",
        exchange,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExchangeController();
