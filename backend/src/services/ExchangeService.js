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
    // The post author is always the Giver
    const giverId = post.author.toString();
    // The other person in the chat (requester) is the Receiver
    // (Unless the owner is offering it, but usually the logic is: Owner gives, Other receives)

    // Validation: A user shouldn't request their own item
    if (giverId === requesterId) {
      // If the owner initiates, they are still the giver, and the other chat participant is receiver
      // We need to find the other participant
      const otherParticipant = chat.participants.find(
        (p) => p.toString() !== requesterId
      );
      if (!otherParticipant) throw new Error("Cannot determine receiver");

      return await this._createExchange(
        chatId,
        postId,
        requesterId,
        otherParticipant.toString()
      );
    } else {
      // Standard case: Requester wants the item
      return await this._createExchange(chatId, postId, giverId, requesterId);
    }
  }

  async _createExchange(chatId, postId, giverId, receiverId) {
    // Check if active exchange already exists for this post in this chat
    const existing = await ExchangeRepository.findByChat(chatId);
    if (
      existing &&
      existing.status !== "cancelled" &&
      existing.status !== "declined"
    ) {
      return existing; // Return existing active exchange
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

    // State Machine Validation
    const validTransitions = {
      requested: ["accepted", "declined", "cancelled"],
      accepted: ["scheduled", "cancelled"], // Must schedule before in_progress
      scheduled: ["in_progress", "cancelled", "scheduled"], // Can reschedule
      in_progress: ["completed", "cancelled"],
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

  async rateExchange(exchangeId, userId, score, feedback) {
    const exchange = await ExchangeRepository.findById(exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    if (exchange.status !== "completed") {
      throw new Error("Cannot rate an incomplete exchange");
    }

    const isGiver = exchange.giver._id.toString() === userId;
    const isReceiver = exchange.receiver._id.toString() === userId;

    if (!isGiver && !isReceiver) {
      throw new Error("Unauthorized");
    }

    // Check if already rated
    if (isGiver && exchange.rating?.giverRating) {
      throw new Error("You have already rated this exchange");
    }
    if (isReceiver && exchange.rating?.receiverRating) {
      throw new Error("You have already rated this exchange");
    }

    const ratingData = { score, feedback };
    return await ExchangeRepository.addRating(exchangeId, isGiver, ratingData);
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
