import Exchange from "../models/Exchange.js";

class ExchangeRepository {
  async create(data) {
    const exchange = new Exchange(data);
    await exchange.save();
    return this.findById(exchange._id);
  }

  async findById(id) {
    return Exchange.findById(id)
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title images")
      .lean();
  }

  async findByChat(chatId) {
    return Exchange.findOne({ chat: chatId })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title images")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByUser(userId, status = null) {
    const query = {
      $or: [{ giver: userId }, { receiver: userId }],
    };

    if (status) {
      query.status = status;
    }

    return Exchange.find(query)
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title images")
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateStatus(id, status, updatedBy, note = null) {
    const exchange = await Exchange.findById(id);
    if (!exchange) throw new Error("Exchange not found");

    exchange.status = status;
    exchange.statusHistory.push({
      status,
      updatedBy,
      note,
      timestamp: new Date(),
    });

    await exchange.save();
    return this.findById(id);
  }

  async updateMeetingDetails(id, meetingDetails) {
    return Exchange.findByIdAndUpdate(
      id,
      { meetingDetails, status: "scheduled" },
      { new: true }
    )
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title images")
      .lean();
  }

  async addRating(id, userId, isGiver, rating) {
    const update = isGiver
      ? { "rating.giverRating": { ...rating, ratedAt: new Date() } }
      : { "rating.receiverRating": { ...rating, ratedAt: new Date() } };

    return Exchange.findByIdAndUpdate(id, update, { new: true })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title images")
      .lean();
  }

  async cancel(id, userId, reason) {
    return Exchange.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancelledBy: userId,
        cancelReason: reason,
      },
      { new: true }
    )
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title images")
      .lean();
  }
}

export default new ExchangeRepository();
