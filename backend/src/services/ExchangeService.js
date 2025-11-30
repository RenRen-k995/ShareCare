import ExchangeRepository from "../repositories/ExchangeRepository.js";
import { Chat } from "../models/Chat.js";
import Post from "../models/Post.js";

class ExchangeService {
  async createExchangeRequest(chatId, postId, requesterId) {
    // 1. Verify chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");
    if (!chat.participants.includes(requesterId)) {
      throw new Error("Unauthorized: You are not a participant of this chat");
    }

    // 2. Verify post exists
    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");

    // 3. Determine Giver and Receiver
    // The post author is always the Giver (they own the item)
    const giverId = post.author.toString();

    // Find the other participant (the one who wants to receive the item)
    const otherParticipant = chat.participants.find(
      (p) => p.toString() !== giverId
    );
    if (!otherParticipant) throw new Error("Cannot determine receiver");

    const receiverId = otherParticipant.toString();

    // Validation: Ensure requester is authorized (can be either party)
    if (requesterId !== giverId && requesterId !== receiverId) {
      throw new Error("Unauthorized: You are not part of this exchange");
    }

    // Standard case: Giver owns the item, Receiver wants it
    return await this._createExchange(chatId, postId, giverId, receiverId);
  }

  async _createExchange(chatId, postId, giverId, receiverId) {
    // Check if active exchange already exists for this post in this chat
    const existing = await ExchangeRepository.findByChat(chatId);
    if (
      existing &&
      existing.status !== "cancelled" &&
      existing.status !== "declined" &&
      existing.status !== "completed"
    ) {
      return existing; // Return existing active exchange (only if not completed)
    }

    const exchangeData = {
      chat: chatId,
      post: postId,
      giver: giverId,
      receiver: receiverId,
      status: "requested",
    };

    return await ExchangeRepository.create(exchangeData);
  }

  async getExchangeByChat(chatId) {
    return await ExchangeRepository.findByChat(chatId);
  }

  async getUserExchanges(userId, status = null) {
    return await ExchangeRepository.findByUser(userId, status);
  }

  async updateExchangeStatus(exchangeId, status, userId, note = null) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    // Authorization Check
    if (
      exchange.giver._id.toString() !== userId &&
      exchange.receiver._id.toString() !== userId
    ) {
      throw new Error("Unauthorized action");
    }

    // Simplified 2-state flow: requested → accepted → completed
    const validTransitions = {
      requested: ["accepted", "declined", "cancelled"],
      accepted: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
      declined: [],
    };

    const currentStatus = exchange.status;
    if (!validTransitions[currentStatus].includes(status)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${status}`
      );
    }

    return await ExchangeRepository.updateStatus(
      exchangeId,
      status,
      userId,
      note
    );
  }

  async scheduleMeeting(exchangeId, meetingDetails, userId) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    // Only participants can schedule
    if (
      exchange.giver._id.toString() !== userId &&
      exchange.receiver._id.toString() !== userId
    ) {
      throw new Error("Unauthorized");
    }

    // Can only schedule if accepted or already scheduled (rescheduling)
    if (!["accepted", "scheduled"].includes(exchange.status)) {
      throw new Error("Exchange must be accepted before scheduling");
    }

    return await ExchangeRepository.updateMeetingDetails(
      exchangeId,
      meetingDetails
    );
  }

  async cancelExchange(exchangeId, userId, reason) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    // Verify participant
    if (
      exchange.giver._id.toString() !== userId &&
      exchange.receiver._id.toString() !== userId
    ) {
      throw new Error("Unauthorized");
    }

    if (["completed", "cancelled", "declined"].includes(exchange.status)) {
      throw new Error("Cannot cancel a finalized exchange");
    }

    return await ExchangeRepository.cancel(exchangeId, userId, reason);
  }
}

export default new ExchangeService();
