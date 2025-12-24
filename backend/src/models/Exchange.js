import mongoose from "mongoose";

/**
 * Exchange Model - Simplified for Donation Platform
 *
 * ShareCare là nền tảng DONATE miễn phí, không cần:
 * - Payment system
 * - Complex dispute handling
 * - Rating system
 * - Verification codes
 *
 * WORKFLOW ĐƠN GIẢN:
 * 1. requested  - Người nhận gửi yêu cầu xin vật phẩm
 * 2. accepted   - Người cho chấp nhận, 2 bên chat hẹn gặp
 * 3. completed  - Đã giao nhận thành công
 * 4. cancelled  - Đã hủy (bởi một trong hai bên)
 * 5. declined   - Người cho từ chối yêu cầu
 */

const exchangeSchema = new mongoose.Schema(
  {
    // ========== CORE REFERENCES ==========
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // ========== PARTICIPANTS ==========
    // Giver = Người cho = Tác giả của bài post
    giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Receiver = Người nhận = Người gửi yêu cầu xin
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========== STATUS - SIMPLIFIED ==========
    status: {
      type: String,
      enum: [
        "requested", // Người nhận đã gửi yêu cầu, chờ người cho xác nhận
        "accepted", // Người cho đã chấp nhận, 2 bên đang chat hẹn gặp
        "completed", // Đã giao nhận thành công
        "cancelled", // Đã hủy
        "declined", // Người cho từ chối
      ],
      default: "requested",
    },

    // ========== MEETING INFO (Optional) ==========
    meetingDetails: {
      scheduledTime: Date,
      location: {
        address: String,
      },
      notes: String,
    },

    // ========== COMPLETION INFO ==========
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completionNote: String,

    // ========== CANCELLATION INFO ==========
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelReason: {
      type: String,
      enum: [
        "changed_mind", // Đổi ý
        "not_available", // Vật phẩm không còn
        "no_response", // Không phản hồi
        "cannot_meet", // Không thể hẹn gặp
        "other", // Lý do khác
      ],
    },
    cancelNote: String,

    // ========== METADATA ==========
    message: String, // Tin nhắn kèm yêu cầu
  },
  { timestamps: true }
);

// ========== INDEXES ==========
exchangeSchema.index({ chat: 1 });
exchangeSchema.index({ post: 1 });
exchangeSchema.index({ giver: 1, status: 1 });
exchangeSchema.index({ receiver: 1, status: 1 });
exchangeSchema.index({ status: 1, createdAt: -1 });

// ========== METHODS ==========

// Check valid status transitions
exchangeSchema.methods.canTransitionTo = function (newStatus) {
  const validTransitions = {
    requested: ["accepted", "declined", "cancelled"],
    accepted: ["completed", "cancelled"],
    completed: [], // Terminal
    cancelled: [], // Terminal
    declined: [], // Terminal
  };
  return validTransitions[this.status]?.includes(newStatus) || false;
};

// ========== VIRTUALS ==========

// Check if exchange is active (can still be modified)
exchangeSchema.virtual("isActive").get(function () {
  return ["requested", "accepted"].includes(this.status);
});

// Check if exchange is terminal (finished)
exchangeSchema.virtual("isTerminal").get(function () {
  return ["completed", "cancelled", "declined"].includes(this.status);
});

const Exchange = mongoose.model("Exchange", exchangeSchema);

export default Exchange;
