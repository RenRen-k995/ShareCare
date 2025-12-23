import Exchange from "../models/Exchange.js";

/**
 * Exchange Repository - Simplified for Donation Platform
 */
class ExchangeRepository {
  // ==================== CREATE ====================

  async create(data) {
    const exchange = new Exchange(data);
    await exchange.save();
    return this.findById(exchange._id);
  }

  // ==================== FIND ====================

  async findById(id) {
    return Exchange.findById(id)
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category status author")
      .populate("completedBy", "username fullName")
      .populate("cancelledBy", "username fullName")
      .lean();
  }

  async findByChat(chatId) {
    return Exchange.findOne({ chat: chatId })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category status author")
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Find active (non-terminal) exchange by chat
   */
  async findActiveByChat(chatId) {
    return Exchange.findOne({
      chat: chatId,
      status: { $in: ["requested", "accepted"] },
    })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category status author")
      .lean();
  }

  /**
   * Find exchanges by user (as giver or receiver)
   */
  async findByUser(userId, status = null) {
    const query = {
      $or: [{ giver: userId }, { receiver: userId }],
    };

    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    return Exchange.find(query)
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category status")
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Find exchanges by post
   */
  async findByPost(postId) {
    return Exchange.find({ post: postId })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .sort({ createdAt: -1 })
      .lean();
  }

  // ==================== UPDATE ====================

  async update(id, updateData) {
    await Exchange.findByIdAndUpdate(id, updateData);
    return this.findById(id);
  }

  // ==================== DELETE ====================

  async delete(id) {
    return Exchange.findByIdAndDelete(id);
  }

  // ==================== STATISTICS ====================

  async countByUser(userId) {
    const [asGiver, asReceiver] = await Promise.all([
      Exchange.countDocuments({
        giver: userId,
        status: "completed",
      }),
      Exchange.countDocuments({
        receiver: userId,
        status: "completed",
      }),
    ]);

    return {
      itemsDonated: asGiver,
      itemsReceived: asReceiver,
      total: asGiver + asReceiver,
    };
  }
}

export default new ExchangeRepository();
