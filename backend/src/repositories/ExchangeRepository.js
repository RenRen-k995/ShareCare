import Exchange from "../models/Exchange.js";

class ExchangeRepository {
  async create(data) {
    const exchange = new Exchange(data);
    return await exchange.save();
  }

  async findById(id) {
    return Exchange.findById(id)
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category")
      .lean();
  }

  async findByChat(chatId) {
    return Exchange.findOne({ chat: chatId })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category")
      .sort({ createdAt: -1 }) // Get the most recent one if multiple exist (rare)
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
      .populate("post", "title image category")
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
    // Return the populated document
    return this.findById(id);
  }

  async updateMeetingDetails(id, meetingDetails) {
    return Exchange.findByIdAndUpdate(
      id,
      {
        meetingDetails,
        status: "scheduled", // Auto-transition to scheduled when meeting is set
        $push: {
          statusHistory: {
            status: "scheduled",
            timestamp: new Date(),
            note: "Meeting scheduled",
          },
        },
      },
      { new: true }
    )
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category")
      .lean();
  }

  async addRating(id, isGiver, rating) {
    const updateField = isGiver
      ? "rating.giverRating"
      : "rating.receiverRating";

    const update = {
      [updateField]: {
        ...rating,
        ratedAt: new Date(),
      },
    };

    return Exchange.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category")
      .lean();
  }

  async cancel(id, userId, reason) {
    return Exchange.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancelledBy: userId,
        cancelReason: reason,
        $push: {
          statusHistory: {
            status: "cancelled",
            updatedBy: userId,
            note: reason,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    )
      .populate("giver", "username fullName avatar")
      .populate("receiver", "username fullName avatar")
      .populate("post", "title image category")
      .lean();
  }
}

export default new ExchangeRepository();
