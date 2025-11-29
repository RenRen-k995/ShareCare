import mongoose from "mongoose";

const exchangeSchema = new mongoose.Schema(
  {
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
    giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "requested", // Initial request sent
        "accepted", // Giver accepted the request
        "scheduled", // Meeting time/location set
        "in_progress", // Item being exchanged
        "completed", // Exchange successful
        "cancelled", // Cancelled by either party
        "declined", // Giver declined the request
      ],
      default: "requested",
    },
    meetingDetails: {
      scheduledTime: {
        type: Date,
      },
      location: {
        address: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      method: {
        type: String,
        enum: ["pickup", "delivery", "meet_halfway"],
      },
      notes: String,
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
      },
    ],
    rating: {
      giverRating: {
        score: {
          type: Number,
          min: 1,
          max: 5,
        },
        feedback: String,
        ratedAt: Date,
      },
      receiverRating: {
        score: {
          type: Number,
          min: 1,
          max: 5,
        },
        feedback: String,
        ratedAt: Date,
      },
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelReason: String,
  },
  { timestamps: true }
);

// Indexes for efficient queries
exchangeSchema.index({ chat: 1 });
exchangeSchema.index({ post: 1 });
exchangeSchema.index({ giver: 1, status: 1 });
exchangeSchema.index({ receiver: 1, status: 1 });
exchangeSchema.index({ status: 1, createdAt: -1 });

// Add status to history before saving
exchangeSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

const Exchange = mongoose.model("Exchange", exchangeSchema);

export default Exchange;
