import ExchangeRepository from "../repositories/ExchangeRepository.js";
import { Chat } from "../models/Chat.js";
import Post from "../models/Post.js";

class ExchangeService {
  async createExchangeRequest(chatId, postId, receiverId) {
    // Verify chat and post exist
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");

    // Check if exchange already exists
    const existing = await ExchangeRepository.findByChat(chatId);
    if (existing) {
      return existing;
    }

    // Create exchange
    const exchangeData = {
      chat: chatId,
      post: postId,
      giver: post.author,
      receiver: receiverId,
      status: "requested",
    };

    return ExchangeRepository.create(exchangeData);
  }

  async getExchangeByChat(chatId) {
    return ExchangeRepository.findByChat(chatId);
  }

  async getUserExchanges(userId, status = null) {
    return ExchangeRepository.findByUser(userId, status);
  }

  async updateExchangeStatus(exchangeId, status, userId, note = null) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    // Verify user is participant
    if (
      exchange.giver._id.toString() !== userId &&
      exchange.receiver._id.toString() !== userId
    ) {
      throw new Error("Unauthorized");
    }

    // Validate status transitions
    const validTransitions = {
      requested: ["accepted", "declined", "cancelled"],
      accepted: ["scheduled", "in_progress", "cancelled"],
      scheduled: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };

    if (
      !validTransitions[exchange.status] ||
      !validTransitions[exchange.status].includes(status)
    ) {
      throw new Error(`Cannot transition from ${exchange.status} to ${status}`);
    }

    return ExchangeRepository.updateStatus(exchangeId, status, userId, note);
  }

  async scheduleMeeting(exchangeId, userId, meetingDetails) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    // Verify user is participant
    if (
      exchange.giver._id.toString() !== userId &&
      exchange.receiver._id.toString() !== userId
    ) {
      throw new Error("Unauthorized");
    }

    return ExchangeRepository.updateMeetingDetails(exchangeId, meetingDetails);
  }

  async rateExchange(exchangeId, userId, rating) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    if (exchange.status !== "completed") {
      throw new Error("Can only rate completed exchanges");
    }

    const isGiver = exchange.giver._id.toString() === userId;
    const isReceiver = exchange.receiver._id.toString() === userId;

    if (!isGiver && !isReceiver) {
      throw new Error("Unauthorized");
    }

    return ExchangeRepository.addRating(exchangeId, userId, isGiver, rating);
  }

  async cancelExchange(exchangeId, userId, reason) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    // Verify user is participant
    if (
      exchange.giver._id.toString() !== userId &&
      exchange.receiver._id.toString() !== userId
    ) {
      throw new Error("Unauthorized");
    }

    if (["completed", "cancelled"].includes(exchange.status)) {
      throw new Error("Cannot cancel this exchange");
    }

    return ExchangeRepository.cancel(exchangeId, userId, reason);
  }
}

export default new ExchangeService();
